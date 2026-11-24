export const LETTER_CLASSES = {
  வல்லினம்: ["க்", "ச்", "ட்", "த்", "ப்", "ற்"],
  மெல்லினம்: ["ங்", "ஞ்", "ண்", "ந்", "ம்", "ன்"],
  இடையினம்: ["ய்", "ர்", "ல்", "வ்", "ழ்", "ள்"],
} as const;

const VOWELS: Record<string, string> = {
  "": "அ", "ா": "ஆ", "ி": "இ", "ீ": "ஈ", "ு": "உ", "ூ": "ஊ",
  "ெ": "எ", "ே": "ஏ", "ை": "ஐ", "ொ": "ஒ", "ோ": "ஓ", "ௌ": "ஔ",
};

export type LetterLabQuestion =
  | { kind: "split"; prompt: string; mei: string; uyir: string }
  | { kind: "classify"; prompt: string; category: keyof typeof LETTER_CLASSES };

export interface LetterLabState {
  question: LetterLabQuestion;
  solved: boolean;
  wrong?: boolean;
  mistakes?: number;
}

export type LetterLabAction =
  | { type: "answer-split"; mei: string; uyir: string }
  | { type: "answer-class"; category: keyof typeof LETTER_CLASSES }
  | { type: "next"; question: LetterLabQuestion };

export function createSplitQuestion(base: string, uyirId: number): LetterLabQuestion {
  const signs = Object.keys(VOWELS);
  const mei = `${base}்`;
  const uyir = VOWELS[signs[uyirId]];
  const prompt = `${base}${signs[uyirId]}`;
  if (!uyir || uyirId < 0 || uyirId >= signs.length) throw new Error("Invalid uyir id");
  return { kind: "split", prompt, mei, uyir };
}

export function createClassifyQuestion(mei: string): LetterLabQuestion {
  const category = Object.entries(LETTER_CLASSES).find(([, letters]) =>
    (letters as readonly string[]).includes(mei),
  );
  if (!category) throw new Error(`Unknown mei: ${mei}`);
  return { kind: "classify", prompt: mei, category: category[0] as keyof typeof LETTER_CLASSES };
}

export function letterLabReducer(state: LetterLabState, action: LetterLabAction): LetterLabState {
  if (action.type === "next") return { question: action.question, solved: false, wrong: false };
  if (state.solved || state.question.kind !== "split") {
    if (action.type !== "answer-class" || state.solved || state.question.kind !== "classify") return state;
    const solved = action.category === state.question.category;
    return { ...state, solved, wrong: !solved, mistakes: (state.mistakes ?? 0) + (solved ? 0 : 1) };
  }
  if (action.type !== "answer-split") return state;
  const solved = action.mei === state.question.mei && action.uyir === state.question.uyir;
  return {
    ...state,
    solved,
    wrong: !solved,
    mistakes: (state.mistakes ?? 0) + (solved ? 0 : 1),
  };
}
