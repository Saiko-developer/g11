import { grade12Unit4Roleplay } from "@/data/grade12/unit4-roleplay";
import { getGrade12Unit3SpeakingCard } from "@/data/grade12/unit3-roleplay";
import {
  grade12Unit1Roleplay,
  isGrade12Unit1RoleplayExercise,
} from "@/data/grade12/unit1-roleplay";
import type { Grade11RoleplayExercise } from "@/lib/grade11RoleplayExercises";
import {
  speakingAllowanceSchema,
  speakingSeconds,
  speakingTime,
  notifySpeakingAllowanceChanged,
  onSpeakingAllowanceChanged,
  type Grade11SpeakingAllowance,
} from "@/lib/grade11SpeakingAllowance";
import { grade11ApiFetch } from "@/lib/grade11ApiFetch";
import { useEffect, useRef, useState } from "react";
import { Loader2, Mic, Phone, PhoneOff, Square } from "lucide-react";
import { toast } from "sonner";
import { useSpeechSynthesis } from "@/hooks/use-voice";
import { useWhisperRecognition } from "@/hooks/use-whisper";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { signInToGrade11 } from "@/lib/grade11SignIn";
import { G11_SYLLABUS } from "@/data/grade11/syllabus";

type Turn = { role: "ai" | "student"; text: string; my?: string; tip?: string };
const EMOTIONS: Record<string, string> = {
  happy: "😊 Happy",
  excited: "🤩 Excited",
  curious: "🤔 Curious",
  encouraging: "💪 Encouraging",
  calm: "😌 Calm",
};

type Phase = "idle" | "thinking" | "speaking" | "listening" | "summary";

class SpeakingFailure extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}
async function callRoleplay(body: object, signal?: AbortSignal) {
  const res = await grade11ApiFetch("/api/g11-roleplay", {
    signal,
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const code = typeof data.error === "string" ? data.error : "";
    const message =
      typeof data.message === "string" && data.message.trim()
        ? data.message
        : res.status === 401
          ? "AI Role-Play သုံးရန် အကောင့်ကို ပြန်အတည်ပြုပါ။"
          : res.status === 429
            ? code === "unit_limit"
              ? "ဒီ Unit အတွက် ယနေ့ AI စကားပြောခွင့် ပြည့်သွားပါပြီ။"
              : "AI ဝန်ဆောင်မှု အလုပ်များနေပါသည်။ ခဏစောင့်ပြီး ပြန်စမ်းပါ။"
            : res.status === 402
              ? "AI Credit မလုံလောက်ပါ။ Credit ဖြည့်ပြီး ပြန်စမ်းပါ။"
              : res.status === 410
                ? "စကားပြောချိန် ကုန်သွားပါပြီ။ အသစ် ပြန်စပါ။"
                : res.status === 503
                  ? "AI စကားပြောဝန်ဆောင်မှုကို ယခု ချိတ်ဆက်မရပါ။ ခဏစောင့်ပြီး ပြန်စမ်းပါ။"
                  : "AI အဖြေ ရယူမရပါ။ ပြန်စမ်းနိုင်ပါတယ်။";
    throw new SpeakingFailure(res.status, code, message);
  }
  return data;
}

export function Grade11RolePlay({
  unit,
  exercise,
}: {
  unit: number;
  exercise?: Grade11RoleplayExercise;
}) {
  const grade12Card = isGrade12Unit1RoleplayExercise(exercise)
    ? grade12Unit1Roleplay[exercise]
    : exercise === grade12Unit4Roleplay.id
      ? grade12Unit4Roleplay
      : getGrade12Unit3SpeakingCard(exercise);
  const grade = grade12Card ? 12 : 11;
  const unitTitle =
    grade12Card?.label ??
    G11_SYLLABUS.filter((node) => node.type === "unit").find((node) => node.number === unit)
      ?.title ??
    "Grade 11 English";
  const [phase, setPhase] = useState<Phase>("idle");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [scenario, setScenario] = useState<{ partner: string; en: string; my: string } | null>(
    null,
  );
  const [hints, setHints] = useState<string[]>([]);
  const [emotion, setEmotion] = useState("happy");
  const [heard, setHeard] = useState("");
  const [summary, setSummary] = useState<{ feedbackMy: string } | null>(null);
  const [left, setLeft] = useState<number | null>(null);
  const sessionRef = useRef("");
  const revisionRef = useRef<number | undefined>(undefined);
  const [allowance, setAllowance] = useState<Grade11SpeakingAllowance | null>(null);
  const [statusAt, setStatusAt] = useState(0);
  const [allowanceError, setAllowanceError] = useState("");
  const [statusLoading, setStatusLoading] = useState(true);
  const [clock, setClock] = useState<{
    expiresAt: string;
    serverNow: string;
    receivedAt: number;
  } | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);
  const endingRef = useRef(false);
  const activeRef = useRef(false);
  const phaseRef = useRef<Phase>("idle");
  const turnsRef = useRef<Turn[]>([]);
  const bufRef = useRef("");
  const sawSpeech = useRef(false);
  const playbackSettled = useRef(false);
  const speechAttempt = useRef(0);
  const [speechRevision, setSpeechRevision] = useState(0);
  const listRef = useRef<HTMLDivElement | null>(null);
  const tts = useSpeechSynthesis();
  const generationRef = useRef(0);
  const requestRef = useRef<AbortController | null>(null);
  const [voiceMode, setVoiceMode] = useState(true);
  const voiceModeRef = useRef(true);
  voiceModeRef.current = voiceMode;
  const [error, setError] = useState("");
  const [authError, setAuthError] = useState(false);

  const set = (p: Phase) => {
    phaseRef.current = p;
    setPhase(p);
  };

  const interimRef = useRef("");
  const send = async () => {
    if (phaseRef.current !== "listening") return;
    const interimClean = interimRef.current.replace(/^[\s.…]+$/, "");
    const text = `${bufRef.current} ${interimClean}`
      .trim()
      .replace(/^[\s.…]+$/, "")
      .slice(0, 1600);
    bufRef.current = "";
    interimRef.current = "";
    setHeard("");
    if (!activeRef.current) return;
    if (!text) {
      if (voiceModeRef.current) rec.start();
      return;
    }
    rec.stop();
    const next = [...turnsRef.current, { role: "student" as const, text }];
    turnsRef.current = next;
    setTurns(next);
    await aiTurn(next);
  };

  const rec = useWhisperRecognition({
    lang: "en",
    context: "speaking",
    silenceMs: 2200,
    speakingScope: () => (sessionRef.current ? { session: sessionRef.current, unit } : undefined),
    onFinal: (t) => {
      if (phaseRef.current !== "listening") return;
      bufRef.current += ` ${t}`;
      interimRef.current = "";
      setHeard(bufRef.current.trim());
    },
    onInterim: (t) => {
      if (phaseRef.current !== "listening") return;
      interimRef.current = t;
      setHeard(`${bufRef.current} ${t}`.trim());
    },
    onSilence: () => void send(),
  });

  const aiTurn = async (history: Turn[], goodbye = false) => {
    set("thinking");
    const generation = generationRef.current;
    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;
    try {
      const r = await callRoleplay(
        {
          unit,
          unitTitle,
          exercise,
          requestId: crypto.randomUUID(),
          revision: revisionRef.current,
          session: sessionRef.current || undefined,
          goodbye,
          turns: history.slice(-20).map(({ role, text, my, tip }) => ({ role, text, my, tip })),
        },
        controller.signal,
      );
      if (!activeRef.current || generation !== generationRef.current) return;
      if (typeof r.session === "string" && !sessionRef.current) {
        sessionRef.current = r.session;
        notifySpeakingAllowanceChanged();
      }
      if (typeof r.revision === "number") revisionRef.current = r.revision;
      if (typeof r.expiresAt === "string" && typeof r.serverNow === "string") {
        const receivedAt = Date.now();
        setClock({ expiresAt: r.expiresAt, serverNow: r.serverNow, receivedAt });
        setRemaining(speakingSeconds(r.expiresAt, r.serverNow, receivedAt, receivedAt));
      }
      endingRef.current = goodbye;
      if (r.scenario) setScenario({ partner: "Saya Owl", en: r.scenario, my: r.scenarioMy ?? "" });
      const withTip = [...history];
      if (r.tip && withTip.length)
        withTip[withTip.length - 1] = { ...withTip[withTip.length - 1], tip: r.tip };
      const restored = Array.isArray(r.history)
        ? (r.history.filter(
            (turn: Turn) =>
              (turn.role === "ai" || turn.role === "student") && typeof turn.text === "string",
          ) as Turn[])
        : null;
      const next = restored ?? [...withTip, { role: "ai" as const, text: r.reply, my: r.replyMy }];
      turnsRef.current = next;
      setTurns(next);
      if (typeof r.emotion === "string" && EMOTIONS[r.emotion]) setEmotion(r.emotion);
      setHints(Array.isArray(r.hints) ? r.hints.slice(0, 3) : []);
      sawSpeech.current = false;
      if (!voiceModeRef.current) {
        if (goodbye) {
          void stop();
          return;
        }
        set("listening");
        return;
      }
      set("speaking");
      playbackSettled.current = false;
      const attempt = ++speechAttempt.current;
      void (async () => {
        try {
          await tts.speak(r.reply, {
            speed: 1,
            voice: "echo",
            provider: "openai",
            speakingScope: { session: sessionRef.current, unit },
          });
        } catch {
          if (
            activeRef.current &&
            generation === generationRef.current &&
            attempt === speechAttempt.current
          )
            setError("AI အသံ ဖွင့်မရပါ။ စာတန်းကို ဖတ်ပြီး စာရိုက်၍ ဆက်လေ့ကျင့်နိုင်ပါတယ်။");
        } finally {
          if (
            activeRef.current &&
            generation === generationRef.current &&
            attempt === speechAttempt.current &&
            phaseRef.current === "speaking"
          ) {
            playbackSettled.current = true;
            setSpeechRevision((old) => old + 1);
          }
        }
      })();
    } catch (e) {
      if (generation !== generationRef.current || controller.signal.aborted) return;
      const message =
        e instanceof SpeakingFailure
          ? e.message
          : "AI ချိတ်ဆက်မှု မအောင်မြင်ပါ။ ပြန်စမ်းနိုင်ပါတယ်။";
      setError(message);
      setAuthError(e instanceof SpeakingFailure && e.status === 401);
      toast.error(message);
      stop(false);
      void refreshLeft();
    }
  };

  // When the partner finishes talking, open the mic automatically.
  useEffect(() => {
    if (phaseRef.current !== "speaking") return;
    if (tts.speaking) {
      sawSpeech.current = true;
      return;
    }
    if ((sawSpeech.current || playbackSettled.current) && activeRef.current) {
      if (endingRef.current) {
        void stop();
        return;
      }
      set("listening");
      bufRef.current = "";
      interimRef.current = "";
      if (voiceModeRef.current) rec.start();
    }
  }, [tts.speaking, speechRevision]); // eslint-disable-line react-hooks/exhaustive-deps

  // Browser may end recognition on its own; keep listening while the call is live.
  useEffect(() => {
    if (
      voiceModeRef.current &&
      !rec.listening &&
      phaseRef.current === "listening" &&
      activeRef.current &&
      !bufRef.current.trim()
    ) {
      const t = setTimeout(() => {
        if (phaseRef.current === "listening" && activeRef.current && !rec.listening) rec.start();
      }, 300);
      return () => clearTimeout(t);
    }
  }, [rec.listening]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    listRef.current?.scrollTo?.({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [turns, heard]);

  const stopRecognition = rec.stop;
  const stopSynthesis = tts.stop;
  useEffect(
    () => () => {
      activeRef.current = false;
      generationRef.current += 1;
      requestRef.current?.abort();
      stopRecognition();
      stopSynthesis();
    },
    [stopRecognition, stopSynthesis],
  );

  const [limit, setLimit] = useState<number | null>(null);
  const refreshLeft = async () => {
    setStatusLoading(true);
    try {
      const { data, error } = await supabase.rpc("grade11_speaking_status", { p_unit: unit });
      const parsed = speakingAllowanceSchema.safeParse(data);
      if (error || !parsed.success) {
        setAllowance(null);
        setLeft(null);
        setAllowanceError("Grade 11 စကားပြောခွင့် စစ်ဆေးမရပါ။ ဆရာထံ အကြောင်းကြားပါ။");
        return;
      }
      const status = parsed.data;
      setAllowance(status);
      setStatusAt(Date.now());
      setAllowanceError("");
      setLeft(Math.max(0, status.limit - status.used));
      setLimit(status.limit);
    } catch {
      setAllowance(null);
      setAllowanceError("စကားပြောခွင့် စစ်ဆေးမရပါ။ ပြန်စမ်းပါ။");
    } finally {
      setStatusLoading(false);
    }
  };
  useEffect(() => {
    void refreshLeft();
  }, [unit]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!clock || !activeRef.current) return;
    const tick = () => {
      const seconds = speakingSeconds(
        clock.expiresAt,
        clock.serverNow,
        clock.receivedAt,
        Date.now(),
      );
      setRemaining(seconds);
      if (seconds === 0 && activeRef.current) void stop();
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [clock]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!allowance || !Number.isFinite(Date.parse(allowance.serverNow))) return;
    const serverTime = Date.parse(allowance.serverNow);
    const nextDay = 86400000 - ((serverTime + 23400000) % 86400000);
    const expiry = allowance.active
      ? Date.parse(allowance.active.expiresAt) - serverTime
      : Infinity;
    const timer = setTimeout(
      () => void refreshLeft(),
      Math.max(50, Math.min(nextDay, expiry) - (Date.now() - statusAt) + 50),
    );
    return () => clearTimeout(timer);
  }, [allowance, statusAt]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => onSpeakingAllowanceChanged(() => void refreshLeft()), [unit]); // eslint-disable-line react-hooks/exhaustive-deps

  // 15 seconds of silence while listening = the student is done; Saya Owl says goodbye.
  useEffect(() => {
    if (!voiceMode || phase !== "listening" || heard) return;
    const t = setTimeout(() => {
      if (
        phaseRef.current !== "listening" ||
        !activeRef.current ||
        rec.isCapturing() ||
        bufRef.current.trim() ||
        interimRef.current.trim()
      )
        return;
      rec.stop();
      void aiTurn(turnsRef.current, true);
    }, 15000);
    return () => clearTimeout(t);
  }, [phase, heard, voiceMode]); // eslint-disable-line react-hooks/exhaustive-deps

  const start = async () => {
    if (
      allowance?.active &&
      Date.parse(allowance.active.expiresAt) <=
        Date.parse(allowance.serverNow) + (Date.now() - statusAt)
    ) {
      await refreshLeft();
      setError("မူလစကားပြောချိန် ပြည့်သွားပါပြီ။ လက်ကျန်အကြိမ်ကို စစ်ပြီး အသစ် စတင်နိုင်ပါတယ်။");
      return;
    }
    if (voiceMode && !rec.supported) {
      toast.error("ဒီ browser မှာ အသံဖမ်းလို့ မရပါ။ Chrome ဖြင့် ဖွင့်ကြည့်ပါ။");
      return;
    }
    const generation = ++generationRef.current;
    setError("");
    setAuthError(false);
    set("thinking");
    const auth = await supabase.auth.getSession().catch(() => null);
    if (generation !== generationRef.current) return;
    if (!auth) {
      set("idle");
      setError("အကောင့်အချက်အလက် စစ်ဆေးမရပါ။ ထပ်စမ်းနိုင်ပါသည်။");
      return;
    }
    if (!auth.data.session) {
      set("idle");
      toast.error("AI နဲ့ စကားပြောရန် Google ဖြင့် အရင် Login ဝင်ပါ။", {
        action: { label: "Login", onClick: () => void signInToGrade11() },
      });
      return;
    }
    try {
      if (voiceMode) {
        const s = await navigator.mediaDevices.getUserMedia({ audio: true });
        s.getTracks().forEach((t) => t.stop());
      }
      if (generation !== generationRef.current) return;
    } catch {
      if (generation !== generationRef.current) return;
      set("idle");
      toast.error(
        "Microphone ခွင့်ပြုချက် မရပါ။ Browser address bar ဘေးက 🔒 ကိုနှိပ်ပြီး Microphone ကို Allow လုပ်ပါ။",
      );
      return;
    }
    activeRef.current = true;
    sessionRef.current = "";
    revisionRef.current = undefined;
    setClock(null);
    setRemaining(null);
    endingRef.current = false;
    turnsRef.current = [];
    setTurns([]);
    setScenario(null);
    setSummary(null);
    setHints([]);
    void aiTurn([]);
  };

  const stop = async (withSummary = true) => {
    activeRef.current = false;
    const generation = ++generationRef.current;
    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;
    rec.stop();
    tts.stop();
    setClock(null);
    setHeard("");
    const said = turnsRef.current.filter((t) => t.role === "student");
    if (!withSummary || !said.length || !sessionRef.current) {
      if (withSummary && sessionRef.current) {
        void callRoleplay({ unit, exercise, session: sessionRef.current, action: "end" })
          .finally(() => {
            notifySpeakingAllowanceChanged();
          })
          .catch(() => {});
      }
      set("idle");
      return;
    }
    set("summary");
    try {
      const result = await callRoleplay(
        {
          unit,
          unitTitle,
          exercise,
          session: sessionRef.current,
          requestId: crypto.randomUUID(),
          revision: revisionRef.current,
          turns: turnsRef.current.slice(-20),
          finish: true,
        },
        controller.signal,
      );
      if (generation === generationRef.current) setSummary(result);
    } catch {
      if (generation !== generationRef.current) return;
      setSummary({ feedbackMy: "အကဲဖြတ်ချက် ရယူမရပါ။ အသစ်ပြန်စနိုင်ပါတယ်။" });
    } finally {
      notifySpeakingAllowanceChanged();
    }
  };

  const sameActive =
    !!allowance?.active &&
    Date.parse(allowance.active.expiresAt) >
      Date.parse(allowance.serverNow) + (Date.now() - statusAt) &&
    allowance.active.unit === unit &&
    (allowance.active.exercise ?? undefined) === exercise;
  const differentActive = !!allowance?.active && !sameActive;
  const dailyBlocked =
    !!allowance &&
    allowance.unitsUsed.length >= allowance.unitLimit &&
    !allowance.unitsUsed.includes(unit);
  const live = phase !== "idle" && phase !== "summary";
  const status: Record<Phase, string> = {
    idle: "",
    thinking: "🤔 စဉ်းစားနေပါတယ်…",
    speaking: `🔊 ${scenario?.partner ?? "AI"} ပြောနေပါတယ်…`,
    listening: voiceMode
      ? "👂 နားထောင်နေပါတယ်… အင်္ဂလိပ်လို ပြောပါ"
      : "သင့်အဖြေကို စာရိုက်ပြီး ပို့ပါ",
    summary: "",
  };

  const interrupt = () => {
    tts.stop();
    sawSpeech.current = false;
    set("listening");
    bufRef.current = "";
    interimRef.current = "";
    if (voiceModeRef.current) rec.start();
  };
  const lastAi = [...turns].reverse().find((t) => t.role === "ai");
  const caption = phase === "listening" ? heard : (lastAi?.text ?? "");

  const emo = EMOTIONS[emotion] ?? EMOTIONS.happy;
  const waveState = phase === "summary" ? "idle" : phase;

  return (
    <section
      aria-label={`Grade ${grade} AI speaking practice`}
      className="relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-b from-card to-muted/40 shadow-sm"
    >
      <div className="space-y-2 border-b border-border bg-muted/40 px-5 py-3 text-xs">
        <p lang="my">တစ်နေ့ Unit ၂ ခု · Unit တစ်ခုလျှင် ၂ ကြိမ် · တစ်ကြိမ် ၅ မိနစ်</p>
        {allowance && (
          <p>
            ယနေ့ စတင်ထားသော Units:{" "}
            {allowance.unitsUsed.length ? allowance.unitsUsed.join(", ") : "မရှိသေး"} ·{" "}
            {allowance.unitsUsed.length}/{allowance.unitLimit} Units · Sessions{" "}
            {allowance.sessionsUsed}/4
          </p>
        )}
        {live && remaining !== null && (
          <p
            role="timer"
            aria-label="Speaking time remaining"
            className="font-semibold text-primary"
          >
            ကျန်ချိန် {speakingTime(remaining)}
          </p>
        )}
        {statusLoading && <p role="status">စကားပြောခွင့် စစ်ဆေးနေသည်…</p>}
        {allowanceError && (
          <p role="alert" className="text-destructive">
            {allowanceError}{" "}
            <button type="button" className="underline" onClick={() => void refreshLeft()}>
              ပြန်စစ်မည်
            </button>
          </p>
        )}
        {!live && differentActive && (
          <div className="space-y-2">
            <p>
              Unit {allowance?.active?.unit} မှာ စကားပြောချိန် ကျန်နေပါသည်။ အရင် conversation ကို
              ပြန်ဆက်ပါ သို့မဟုတ် အဆုံးသတ်ပါ။
            </p>
            <button
              type="button"
              className="font-medium text-primary underline"
              onClick={async () => {
                try {
                  await callRoleplay({
                    unit: allowance!.active!.unit,
                    session: allowance!.active!.session,
                    action: "end",
                  });
                  notifySpeakingAllowanceChanged();
                } catch (e) {
                  setError(e instanceof Error ? e.message : "အဆုံးသတ်မရပါ။");
                }
              }}
            >
              အရင် conversation ကို အဆုံးသတ်မည်
            </button>
          </div>
        )}
        {!live && dailyBlocked && (
          <p>
            ဒီနေ့ Unit အသစ် ထပ်ရွေးမရပါ။ ရွေးထားသော Unit များတွင် လက်ကျန်အကြိမ်ကို သုံးနိုင်ပါတယ်။
          </p>
        )}
      </div>
      <div className="flex items-center justify-between px-5 pt-4 text-xs">
        <span className="flex items-center gap-2 font-semibold text-foreground">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-sm">
            🦉
          </span>
          Saya Owl
          <span className="font-normal text-muted-foreground">
            · Grade {grade} · Unit {unit}
          </span>
        </span>
        {live ? (
          <span className="flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 font-medium text-primary">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" /> Live
          </span>
        ) : null}
      </div>

      <p lang="my" className="px-5 pt-3 text-xs text-muted-foreground">
        Grade {grade} ခေါင်းစဉ်အလိုက် AI နှင့် စကားပြောလေ့ကျင့်ခြင်း ဖြစ်ပါသည်။ AI က
        စကားပြောအခြေအနေကို ဖန်တီးပေးပါမည်။ လက်ရှိ credit စည်းကမ်းအတိုင်း ကောက်ခံပြီး Grade 10/11
        {grade12Card ? "/12" : ""} ၏ တူညီသော unit နံပါတ်များတွင် နေ့စဉ် Speaking quota ကို
        မျှသုံးပါသည်။
      </p>
      {error && (
        <p role="alert" lang="my" className="px-5 pt-3 text-sm text-destructive">
          {error}
          {authError && (
            <button type="button" onClick={() => void signInToGrade11()} className="ml-2 underline">
              Login
            </button>
          )}
        </p>
      )}
      {!live && (
        <label className="flex items-center gap-2 px-5 pt-3 text-sm">
          <input
            type="checkbox"
            checked={voiceMode}
            onChange={(e) => setVoiceMode(e.target.checked)}
          />
          အသံဖြင့် စကားပြောမည် (ပိတ်လျှင် စာရိုက်၍ လေ့ကျင့်နိုင်သည်)
        </label>
      )}
      {phase !== "summary" && (
        <div className="flex flex-col items-center px-5 pb-4 pt-6">
          <div
            className={cn("voice-wave", `voice-wave--${waveState}`)}
            data-emotion={live ? emotion : undefined}
            aria-hidden
          >
            {Array.from({ length: 7 }).map((_, i) => (
              <span key={i} />
            ))}
          </div>
          <p className="mt-3 min-h-[1.25rem] text-sm text-muted-foreground">
            {phase === "idle" ? "English speaking partner" : status[phase]}
          </p>
          {live && (
            <span
              className={cn(
                "mt-2 rounded-full border border-border/60 bg-background/70 px-2.5 py-0.5 text-[11px] text-muted-foreground transition-opacity duration-300",
                phase !== "thinking" && lastAi ? "opacity-100" : "opacity-0",
              )}
            >
              {emo || "\u00A0"}
            </span>
          )}

          {scenario && (
            <p className="mt-4 max-w-md text-center text-xs text-muted-foreground">
              🎭 {scenario.en}
              {scenario.my ? ` — ${scenario.my}` : ""}
            </p>
          )}

          {live && (
            <div
              role="region"
              aria-label="Live AI conversation captions"
              className="mt-5 h-36 w-full max-w-lg overflow-y-auto text-center [scrollbar-width:thin]"
            >
              <p
                className={cn(
                  "text-lg font-medium leading-snug text-foreground transition-colors duration-300",
                  phase === "listening" && "italic text-muted-foreground",
                )}
              >
                {caption ||
                  (phase === "listening"
                    ? voiceMode
                      ? "🎤 ပြောပါ…"
                      : "သင့်အဖြေကို အောက်တွင် ရေးပါ။"
                    : "")}
              </p>
              {phase !== "listening" && lastAi?.my && (
                <p className="mt-1 text-xs text-muted-foreground">{lastAi.my}</p>
              )}
            </div>
          )}

          {phase === "listening" && (
            <label className="mt-3 block w-full max-w-lg text-sm">
              သင့်အဖြေ
              <textarea
                aria-label="Your AI conversation reply"
                maxLength={1600}
                className="mt-2 w-full rounded-xl border border-border bg-background p-3"
                value={heard}
                onChange={(event) => {
                  rec.stop();
                  bufRef.current = event.target.value;
                  interimRef.current = "";
                  setHeard(event.target.value);
                }}
              />
            </label>
          )}
          {phase === "listening" && hints.length > 0 && (
            <details className="mt-3 w-full max-w-lg text-sm">
              <summary className="cursor-pointer text-center text-xs text-muted-foreground">
                💡 ဘာပြောရမလဲ မသိရင် နှိပ်ပါ
              </summary>
              <div className="mt-2 space-y-1.5">
                {hints.map((h) => (
                  <p key={h} className="rounded-xl bg-muted px-3 py-2">
                    {h}
                  </p>
                ))}
              </div>
            </details>
          )}

          {turns.length > 0 && (
            <details className="mt-3 w-full max-w-lg text-sm">
              <summary className="cursor-pointer text-center text-xs text-muted-foreground">
                📝 စကားပြော မှတ်တမ်း
              </summary>
              <div ref={listRef} className="mt-2 max-h-64 space-y-2 overflow-y-auto">
                {turns.map((t, i) => (
                  <div
                    key={i}
                    className={cn("flex", t.role === "student" ? "justify-end" : "justify-start")}
                  >
                    <div
                      className={cn(
                        "max-w-[85%] rounded-2xl px-3 py-2",
                        t.role === "student"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-foreground",
                      )}
                    >
                      <p>{t.text}</p>
                      {t.tip && <p className="mt-1 text-xs opacity-80">💡 {t.tip}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </details>
          )}
        </div>
      )}

      {phase === "summary" && (
        <div className="m-4 space-y-2 rounded-2xl border border-border/60 bg-background p-4 text-sm text-foreground">
          <p className="font-bold">📋 စကားပြော အကဲဖြတ်ချက်</p>
          {!summary ? (
            <p className="text-muted-foreground">
              <Loader2 className="mr-1 inline h-4 w-4 animate-spin" /> စစ်ဆေးနေပါတယ်…
            </p>
          ) : (
            <>
              <p>{summary.feedbackMy}</p>
            </>
          )}
        </div>
      )}

      <div className="flex items-center justify-center gap-4 px-5 pb-6">
        {live ? (
          <>
            {phase === "speaking" && (
              <button
                type="button"
                onClick={interrupt}
                aria-label="ကြားဖြတ်ပြောမည်"
                className="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-background text-foreground transition hover:bg-muted"
              >
                <Square className="h-4 w-4" />
              </button>
            )}
            {phase === "listening" && (
              <button
                type="button"
                onClick={() => void send()}
                disabled={!heard}
                aria-label="ပို့မည်"
                className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground transition hover:opacity-90 disabled:opacity-40"
              >
                <Mic className="h-5 w-5" />
              </button>
            )}
            <button
              type="button"
              onClick={() => void stop()}
              aria-label="ရပ်မည်"
              className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive text-destructive-foreground transition hover:opacity-90"
            >
              <PhoneOff className="h-5 w-5" />
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={start}
              disabled={
                statusLoading ||
                !!allowanceError ||
                differentActive ||
                dailyBlocked ||
                (left === 0 && !sameActive) ||
                (phase === "summary" && !summary)
              }
              className="flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-md transition hover:opacity-90"
            >
              <Phone className="h-4 w-4" />{" "}
              {sameActive
                ? "မူလ စကားပြောမှုကို ပြန်ဆက်မည်"
                : phase === "summary"
                  ? "အသစ် ပြန်စမည်"
                  : "စကားပြော စတင်မည်"}
            </button>
            {left !== null && left >= 0 && (
              <p className="text-xs text-muted-foreground">
                {left > 0
                  ? `ဒီ Unit မှာ ယနေ့ စကားပြောခွင့် ${left}/${limit ?? left} ကြိမ် ကျန်ပါတယ်`
                  : "ဒီ Unit အတွက် ယနေ့ စကားပြောခွင့် ပြည့်ပါပြီ"}
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
