"use client";

import * as React from "react";
import { 
  ArrowUpIcon, 
  CheckIcon, 
  Loader2Icon, 
  Sparkles, 
  Plus, 
  Search, 
  Paperclip, 
  Image, 
  FileText 
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Motion and Layout Tokens
// ---------------------------------------------------------------------------
const EASE = [0.2, 0, 0, 1] as const;
const SPRING_SOFT = { type: "spring" as const, stiffness: 420, damping: 32 };
const SPRING_HEIGHT = { type: "spring" as const, stiffness: 380, damping: 34 };
const SPRING_PRESS = { type: "spring" as const, stiffness: 500, damping: 28 };
const SPRING_ICON = { type: "spring" as const, duration: 0.3, bounce: 0 };

const FADE_ONLY = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

const ICON_SWAP = {
  initial: { opacity: 0, scale: 0.25, filter: "blur(4px)" },
  animate: { opacity: 1, scale: 1, filter: "blur(0px)" },
  exit: { opacity: 0, scale: 0.25, filter: "blur(4px)" },
  transition: SPRING_ICON,
};

function placeholderPresence(reduceMotion: boolean) {
  if (reduceMotion) return FADE_ONLY;
  return {
    initial: { opacity: 0, y: 6, filter: "blur(4px)" },
    animate: { opacity: 1, y: 0, filter: "blur(0px)" },
    exit: { opacity: 0, y: -6, filter: "blur(4px)" },
    transition: { duration: 0.35, ease: EASE },
  };
}

function iconPresence(reduceMotion: boolean) {
  return reduceMotion ? FADE_ONLY : ICON_SWAP;
}

// ---------------------------------------------------------------------------
// Default Placeholders for SmartGov AI
// ---------------------------------------------------------------------------
export const DEFAULT_PLACEHOLDERS = [
  "Ask SmartGov AI anything...",
  "Which government scholarships am I eligible for?",
  "Find government benefits for farmers...",
  "How do I apply for the Startup India scheme?",
  "Tell me about national healthcare programs...",
  "Are there subsidies for solar panel installation?",
] as const;

export interface AiPromptInputProps {
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  onSubmit?: (value: string) => void;
  placeholders?: readonly string[];
  placeholderInterval?: number;
  disabled?: boolean;
  status?: "idle" | "loading" | "success";
  maxLength?: number;
  minRows?: number;
  maxRows?: number;
  className?: string;
  textareaClassName?: string;
  "aria-label"?: string;
}

// Helper to controllable state
function useControllableState<T>({
  value,
  defaultValue,
  onChange,
}: {
  value: T | undefined;
  defaultValue: T;
  onChange?: (value: T) => void;
}): [T, (next: T | ((prev: T) => T)) => void] {
  const [uncontrolled, setUncontrolled] = React.useState(defaultValue);
  const isControlled = value !== undefined;
  const current = isControlled ? value : uncontrolled;

  const setValue = React.useCallback(
    (next: T | ((prev: T) => T)) => {
      const resolved =
        typeof next === "function" ? (next as (prev: T) => T)(current) : next;
      if (!isControlled) setUncontrolled(resolved);
      onChange?.(resolved);
    },
    [isControlled, onChange, current]
  );

  return [current, setValue];
}

function usePrefersReducedMotion() {
  const [reduceMotion, setReduceMotion] = React.useState(false);
  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduceMotion(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  return reduceMotion;
}

function assignRef<T>(
  node: T | null,
  ...refs: Array<React.Ref<T> | undefined>
) {
  for (const ref of refs) {
    if (typeof ref === "function") ref(node);
    else if (ref) (ref as React.MutableRefObject<T | null>).current = node;
  }
}

// ---------------------------------------------------------------------------
// ActionButton (Send / Loading Indicator)
// ---------------------------------------------------------------------------
function ActionButton({
  disabled,
  status,
  hasText,
  onSend,
  reduceMotion,
}: {
  disabled?: boolean;
  status: "idle" | "loading" | "success";
  hasText: boolean;
  onSend: () => void;
  reduceMotion: boolean;
}) {
  const isLoading = status === "loading";
  const isSuccess = status === "success";
  const showSend = hasText || isLoading || isSuccess;

  const label = isLoading
    ? "Sending"
    : isSuccess
      ? "Sent"
      : "Send message";

  return (
    <motion.button
      type="button"
      aria-label={label}
      aria-busy={isLoading || undefined}
      disabled={disabled || isLoading || !hasText}
      onClick={onSend}
      whileHover={
        disabled || !hasText ? undefined : { scale: 1.06, transition: SPRING_SOFT }
      }
      whileTap={disabled || !hasText ? undefined : { scale: 0.94 }}
      animate={{
        scale: isSuccess ? [1, 1.08, 1] : 1,
      }}
      transition={SPRING_PRESS}
      className={cn(
        "relative flex size-10 cursor-pointer items-center justify-center overflow-hidden rounded-full transition-all duration-200",
        "focus-visible:ring-ring/50 focus-visible:ring-2 focus-visible:outline-none disabled:pointer-events-none",
        showSend
          ? [
              "bg-primary text-white shadow-md shadow-primary/10",
              "hover:bg-primary-dark hover:shadow-lg hover:shadow-primary/20",
            ]
          : "bg-muted text-muted-foreground opacity-50"
      )}
    >
      <AnimatePresence mode="wait" initial={false}>
        {isLoading ? (
          <motion.span key="loader" {...iconPresence(reduceMotion)} className="flex">
            <Loader2Icon className="size-4 animate-spin" aria-hidden />
          </motion.span>
        ) : isSuccess ? (
          <motion.span key="check" {...iconPresence(reduceMotion)} className="flex">
            <CheckIcon className="size-4" aria-hidden />
          </motion.span>
        ) : (
          <motion.span key="arrow" {...iconPresence(reduceMotion)} className="flex">
            <ArrowUpIcon className="size-4 text-white" aria-hidden />
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

// ---------------------------------------------------------------------------
// RotatingPlaceholder
// ---------------------------------------------------------------------------
function RotatingPlaceholder({
  phrases,
  interval,
  active,
  reduceMotion,
}: {
  phrases: readonly string[];
  interval: number;
  active: boolean;
  reduceMotion: boolean;
}) {
  const [index, setIndex] = React.useState(0);
  const safePhrases = phrases.length > 0 ? phrases : DEFAULT_PLACEHOLDERS;
  const phraseCount = safePhrases.length;

  React.useEffect(() => {
    if (!active || reduceMotion || phraseCount <= 1) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % phraseCount);
    }, interval);
    return () => window.clearInterval(id);
  }, [active, interval, reduceMotion, phraseCount]);

  const current = safePhrases[index % phraseCount] ?? safePhrases[0];

  if (!active) return null;

  return (
    <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 px-1">
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={current}
          className="text-muted-foreground/65 block truncate text-[14px] leading-7 sm:text-base"
          {...placeholderPresence(reduceMotion)}
        >
          {current}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
const AiPromptInput = React.forwardRef<HTMLTextAreaElement, AiPromptInputProps>(
  (
    {
      value: valueProp,
      defaultValue = "",
      onChange,
      onSubmit,
      placeholders = DEFAULT_PLACEHOLDERS,
      placeholderInterval = 3200,
      disabled = false,
      status = "idle",
      maxLength = 4000,
      minRows = 1,
      maxRows = 8,
      className,
      textareaClassName,
      "aria-label": ariaLabel = "AI prompt",
    },
    ref
  ) => {
    const [value, setValue] = useControllableState({
      value: valueProp,
      defaultValue,
      onChange,
    });

    const [focused, setFocused] = React.useState(false);
    const [height, setHeight] = React.useState<number | "auto">("auto");
    const [plusMenuOpen, setPlusMenuOpen] = React.useState(false);
    const reduceMotion = usePrefersReducedMotion();

    const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);
    const mirrorRef = React.useRef<HTMLDivElement | null>(null);
    const fieldId = React.useId();

    const trimmed = value.trim();
    const hasText = trimmed.length > 0;
    const showPlaceholder = value.length === 0 && !focused;

    const resize = React.useCallback(() => {
      const el = textareaRef.current;
      const mirror = mirrorRef.current;
      if (!el) return;

      const styles = window.getComputedStyle(el);
      const lineHeight = Number.parseFloat(styles.lineHeight) || 28;
      const paddingY =
        Number.parseFloat(styles.paddingTop) +
        Number.parseFloat(styles.paddingBottom);
      const minH = lineHeight * minRows + paddingY;
      const maxH = lineHeight * maxRows + paddingY;

      if (mirror) {
        mirror.style.width = `${el.clientWidth}px`;
        mirror.textContent = value.endsWith("\n") ? `${value} ` : value || " ";
        const next = Math.min(Math.max(mirror.scrollHeight, minH), maxH);
        setHeight(next);
        el.style.overflowY = mirror.scrollHeight > maxH ? "auto" : "hidden";
      } else {
        el.style.height = "auto";
        const next = Math.min(Math.max(el.scrollHeight, minH), maxH);
        setHeight(next);
        el.style.overflowY = el.scrollHeight > maxH ? "auto" : "hidden";
      }
    }, [value, minRows, maxRows]);

    React.useLayoutEffect(() => {
      resize();
    }, [resize]);

    const submit = React.useCallback(() => {
      if (disabled || status === "loading" || !trimmed) return;
      onSubmit?.(trimmed);
      setValue(""); // clear value on submit
    }, [disabled, status, trimmed, onSubmit, setValue]);

    const onKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (
        event.key === "Enter" &&
        !event.shiftKey &&
        !event.nativeEvent.isComposing
      ) {
        event.preventDefault();
        submit();
      }
    };

    return (
      <motion.div
        data-focused={focused || undefined}
        data-disabled={disabled || undefined}
        data-status={status}
        animate={
          reduceMotion
            ? undefined
            : {
                boxShadow: focused
                  ? "0 4px 12px rgba(15, 23, 42, 0.05), 0 16px 40px -12px rgba(15, 23, 42, 0.15)"
                  : "0 1px 2px rgba(15, 23, 42, 0.02), 0 8px 24px -12px rgba(15, 23, 42, 0.08)",
              }
        }
        transition={{ duration: 0.28, ease: EASE }}
        className={cn(
          "bg-white border-border relative w-full overflow-visible rounded-[1.5rem] border p-3",
          "transition-[background-color,opacity] duration-200",
          disabled && "pointer-events-none opacity-50",
          className
        )}
      >
        <div
          ref={mirrorRef}
          aria-hidden
          className="invisible absolute top-0 left-0 -z-10 px-1 text-[15px] leading-7 break-words whitespace-pre-wrap sm:text-base"
        />

        <div className="flex items-start gap-2 relative min-h-8">
          {/* Plus Action Menu */}
          <div className="relative flex shrink-0 self-start mt-0.5">
            <button
              type="button"
              onClick={() => setPlusMenuOpen(!plusMenuOpen)}
              className="flex size-7.5 items-center justify-center rounded-full hover:bg-muted text-[#64748B] hover:text-[#0F172A] transition-colors focus-visible:outline-none"
            >
              <Plus className="size-4.5" />
            </button>
            {plusMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setPlusMenuOpen(false)} />
                <div className="absolute bottom-9 left-0 z-50 w-44 rounded-xl border border-border bg-white p-1.5 shadow-md animate-in fade-in-0 slide-in-from-bottom-2">
                  <button
                    type="button"
                    onClick={() => { setPlusMenuOpen(false); alert("File uploads not supported by backend."); }}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-semibold text-[#0F172A] hover:bg-[#F1F5F9] text-left transition-colors"
                  >
                    <Paperclip className="size-4 text-[#64748B]" />
                    <span>Upload file</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setPlusMenuOpen(false); alert("Image uploads not supported by backend."); }}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-semibold text-[#0F172A] hover:bg-[#F1F5F9] text-left transition-colors"
                  >
                    <Image className="size-4 text-[#64748B]" />
                    <span>Upload image</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setPlusMenuOpen(false); alert("Document uploads not supported by backend."); }}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-semibold text-[#0F172A] hover:bg-[#F1F5F9] text-left transition-colors"
                  >
                    <FileText className="size-4 text-[#64748B]" />
                    <span>Upload document</span>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Search Action Icon */}
          <div className="flex shrink-0 self-start mt-0.5">
            <button
              type="button"
              className="group flex size-7.5 items-center justify-center rounded-full hover:bg-muted transition-colors focus-visible:outline-none"
            >
              <Search 
                className="size-4.5 text-slate-700 group-hover:text-[#168A5A] transition-colors" 
                stroke="currentColor"
                strokeWidth={2}
              />
            </button>
          </div>

          {/* Text Area container */}
          <div className="relative flex-1 min-h-7 self-center">
            <RotatingPlaceholder
              phrases={placeholders}
              interval={placeholderInterval}
              active={showPlaceholder}
              reduceMotion={reduceMotion}
            />

            <motion.textarea
              id={fieldId}
              ref={(node) => assignRef(node, ref, textareaRef)}
              value={value}
              disabled={disabled}
              rows={minRows}
              maxLength={maxLength}
              aria-label={ariaLabel}
              aria-multiline="true"
              onChange={(event) => setValue(event.target.value)}
              onKeyDown={onKeyDown}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              animate={
                reduceMotion
                  ? undefined
                  : { height: typeof height === "number" ? height : undefined }
              }
              transition={SPRING_HEIGHT}
              className={cn(
                "text-[#0F172A] relative z-10 block w-full resize-none bg-transparent px-1",
                "text-[15px] leading-7 sm:text-base",
                "placeholder:text-transparent",
                "outline-none focus-visible:outline-none",
                "disabled:cursor-not-allowed",
                "caret-primary",
                textareaClassName
              )}
              style={
                reduceMotion && typeof height === "number"
                  ? { height }
                  : undefined
              }
            />
          </div>
        </div>

        <div className="border-border mt-3 flex items-center justify-between border-t pt-2.5">
          {/* Active Model tag (Static display of the smartgov engine) */}
          <div className="flex items-center gap-1.5 bg-[#E8F5EF] text-[#0F172A] rounded-full px-3 py-1.5 text-xs font-bold select-none border border-[#168A5A]/10">
            <Sparkles className="size-3.5 text-[#168A5A] shrink-0" />
            <span>SmartGov Gemini Engine</span>
          </div>

          <div className="flex items-center">
            <ActionButton
              disabled={disabled}
              status={status}
              hasText={hasText}
              onSend={submit}
              reduceMotion={reduceMotion}
            />
          </div>
        </div>
      </motion.div>
    );
  }
);

AiPromptInput.displayName = "AiPromptInput";

export { AiPromptInput };
