import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useTheme } from "@/contexts/ThemeContext";
import AppShell from "@/components/AppShell";
import { trpc } from "@/lib/trpc";
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Search,
  Shirt,
  Settings,
  X,
  RotateCcw,
  CheckCircle,
  TrendingUp,
  User,
  Heart,
  Plus,
  Sun,
  Moon,
} from "lucide-react";
import { toast } from "sonner";

// ─── Types & Defaults ─────────────────────────────────────────────────────────

type Step = 1 | 2 | 3;
type ShapeOption = "flatter" | "average" | "curvier" | "straighter" | "wider";

export interface BodyShapePreset {
  id: string;
  name: string;
  desc: string;
}

export const FEMALE_BODY_SHAPES: BodyShapePreset[] = [
  { id: "Petite", name: "Petite", desc: "Compact & slender frame" },
  { id: "Column", name: "Column", desc: "Balanced straight torso" },
  { id: "Inverted Triangle", name: "Inverted Triangle", desc: "Broader shoulders & bust" },
  { id: "Apple", name: "Apple", desc: "Fuller midsection & chest" },
  { id: "Brick", name: "Brick", desc: "Athletic rectangular build" },
  { id: "Pear", name: "Pear", desc: "Narrow shoulders, broader hips" },
  { id: "Hourglass", name: "Hourglass", desc: "Balanced bust & hips, defined waist" },
  { id: "Full Hourglass", name: "Full Hourglass", desc: "Ample bust & hips, waist curve" },
];

export const MALE_BODY_SHAPES: BodyShapePreset[] = [
  { id: "Column", name: "Column", desc: "Slender linear build" },
  { id: "Trapezium", name: "Trapezium", desc: "Broad shoulders, trim waist" },
  { id: "Circle", name: "Circle", desc: "Rounded central torso" },
  { id: "Oval", name: "Oval", desc: "Rounded upper & mid section" },
  { id: "Rectangle", name: "Rectangle", desc: "Straight line torso" },
  { id: "Square", name: "Square", desc: "Broad muscular frame" },
  { id: "Inverted Triangle", name: "Inverted Triangle", desc: "Wide V-taper shoulders" },
  { id: "Triangle", name: "Triangle", desc: "Narrow shoulders, wider hips" },
];

interface AdvancedMeasurements {
  head: { forehead: string; ears: string; nape: string };
  shoulders: string;
  bust: string;
  body: string;
  legs: string;
  foot: string;
}

interface MannequinSlot {
  id: number;            // 0, 1, 2
  gender: "man" | "woman";
  height: string;
  weight: string;
  age: string;
  bodyShape?: string;
  bellyShape: ShapeOption;
  hipShape: ShapeOption;
  chestSize: ShapeOption;
  nickname: string;
  advanced: AdvancedMeasurements;
}

const DEFAULT_MEASUREMENTS: AdvancedMeasurements = {
  head: { forehead: "56", ears: "57", nape: "55" },
  shoulders: "42",
  bust: "92",
  body: "88",
  legs: "95",
  foot: "26",
};

const EMPTY_SLOT = (id: number): MannequinSlot => ({
  id,
  gender: "woman",
  height: "172",
  weight: "62",
  age: "24",
  bodyShape: "Hourglass",
  bellyShape: "average",
  hipShape: "average",
  chestSize: "average",
  nickname: "",
  advanced: { ...DEFAULT_MEASUREMENTS },
});

// ─── Main Component ────────────────────────────────────────────────────────────

export default function MannequinCustomizer() {
  const [, setLocation] = useLocation();
  const { theme, toggleTheme } = useTheme();

  // ── Multi-mannequin slots (up to 3) ──
  const [slots, setSlots] = useState<(MannequinSlot | null)[]>([null, null, null]);
  const [activeSlot, setActiveSlot] = useState<number>(0); // 0, 1, or 2

  // Mannequin state (mirrors active slot while wizard is open)
  const [hasMannequin, setHasMannequin] = useState<boolean>(false);
  const [isWizardActive, setIsWizardActive] = useState<boolean>(false);
  const [wizardStep, setWizardStep] = useState<Step>(1);

  // Setup form fields
  const [gender, setGender] = useState<"man" | "woman">("woman");
  const [selectedBodyShape, setSelectedBodyShape] = useState<string>("Hourglass");
  const [height, setHeight] = useState<string>("172");
  const [weight, setWeight] = useState<string>("62");
  const [age, setAge] = useState<string>("24");
  const [bellyShape, setBellyShape] = useState<ShapeOption>("average");
  const [hipShape, setHipShape] = useState<ShapeOption>("average");
  const [chestSize, setChestSize] = useState<ShapeOption>("average");
  const [nickname, setNickname] = useState<string>("");

  // Advanced measurements state
  const [showAdvancedPanel, setShowAdvancedPanel] = useState<boolean>(false);
  const [activeSubScreen, setActiveSubScreen] = useState<string | null>(null);
  const [advanced, setAdvanced] = useState<AdvancedMeasurements>(DEFAULT_MEASUREMENTS);

  const { data: dbMannequins = [], refetch } = trpc.mannequin.getAll.useQuery();
  const saveMutation = trpc.mannequin.save.useMutation();

  // Sync database mannequins to client slots
  useEffect(() => {
    if (dbMannequins && dbMannequins.length > 0) {
      const updated = [...slots];
      dbMannequins.forEach((m: any) => {
        const idx = m.slot - 1; // 0-indexed
        if (idx >= 0 && idx < 3) {
          updated[idx] = {
            id: idx,
            gender: (m.gender as "man" | "woman") || "woman",
            height: String(m.height || 172),
            weight: String(m.weight || 62),
            age: "24",
            bellyShape: "average",
            hipShape: "average",
            chestSize: "average",
            nickname: m.name || "",
            advanced: {
              head: { forehead: "56", ears: "57", nape: "55" },
              shoulders: "42",
              bust: String(m.bust || 92),
              body: String(m.waist || 88),
              legs: String(m.hips || 95),
              foot: "26",
            }
          };
        }
      });
      setSlots(updated);
      const firstFilled = updated.findIndex(s => s !== null);
      if (firstFilled !== -1) {
        setHasMannequin(true);
        setActiveSlot(firstFilled);
        loadSlotIntoForm(updated[firstFilled]!);
      }
    }
  }, [dbMannequins]);

  // ── Load all slots from localStorage on mount ──
  useEffect(() => {
    const savedSlots: (MannequinSlot | null)[] = [null, null, null];
    let anyFound = false;
    for (let i = 0; i < 3; i++) {
      const raw = localStorage.getItem(`mannequin_slot_${i}`);
      if (raw) {
        savedSlots[i] = JSON.parse(raw) as MannequinSlot;
        anyFound = true;
      }
    }
    // Backward compat: migrate legacy single-mannequin data into slot 0
    if (!anyFound) {
      const savedHas = localStorage.getItem("has_mannequin");
      if (savedHas === "true") {
        const legacySlot: MannequinSlot = {
          id: 0,
          gender: (localStorage.getItem("mannequin_gender") as "man" | "woman") || "woman",
          height: localStorage.getItem("mannequin_height") || "172",
          weight: localStorage.getItem("mannequin_weight") || "62",
          age: localStorage.getItem("mannequin_age") || "24",
          bellyShape: (localStorage.getItem("mannequin_belly") as ShapeOption) || "average",
          hipShape: (localStorage.getItem("mannequin_hip") as ShapeOption) || "average",
          chestSize: (localStorage.getItem("mannequin_chest") as ShapeOption) || "average",
          nickname: localStorage.getItem("mannequin_nickname") || "",
          advanced: (() => { try { return JSON.parse(localStorage.getItem("mannequin_advanced") || ""); } catch { return { ...DEFAULT_MEASUREMENTS }; } })(),
        };
        savedSlots[0] = legacySlot;
        localStorage.setItem("mannequin_slot_0", JSON.stringify(legacySlot));
      }
    }
    setSlots(savedSlots);
    // Find first filled slot and sync form fields
    const firstFilled = savedSlots.findIndex(s => s !== null);
    if (firstFilled !== -1) {
      setHasMannequin(true);
      const s = savedSlots[firstFilled]!;
      setActiveSlot(firstFilled);
      loadSlotIntoForm(s);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Helper: copy a slot's data into form fields
  const loadSlotIntoForm = (s: MannequinSlot) => {
    setGender(s.gender);
    if (s.bodyShape) setSelectedBodyShape(s.bodyShape);
    else setSelectedBodyShape(s.gender === "woman" ? "Hourglass" : "Trapezium");
    setHeight(s.height || "172");
    setWeight(s.weight || "62");
    setAge(s.age || "24");
    setBellyShape(s.bellyShape);
    setHipShape(s.hipShape);
    setChestSize(s.chestSize);
    setNickname(s.nickname);
    setAdvanced(s.advanced);
  };

  // Switch active slot
  const switchSlot = (idx: number) => {
    const s = slots[idx];
    if (!s) return;
    setActiveSlot(idx);
    loadSlotIntoForm(s);
  };

  // Delete a secondary slot (only slot 1 or 2)
  const deleteSlot = (idx: number) => {
    if (idx === 0) return;
    const updated = [...slots];
    updated[idx] = null;
    setSlots(updated);
    localStorage.removeItem(`mannequin_slot_${idx}`);
    if (activeSlot === idx) {
      setActiveSlot(0);
      const s = updated[0];
      if (s) loadSlotIntoForm(s);
    }
    toast.success("Mannequin removed");
  };

  // Start wizard for a specific slot
  const handleCreateMannequin = (slotIdx?: number) => {
    if (slotIdx !== undefined) setActiveSlot(slotIdx);
    // pre-fill form with existing slot if recreating
    const targetSlot = slots[slotIdx ?? activeSlot];
    if (targetSlot) loadSlotIntoForm(targetSlot);
    else {
      setGender("woman");
      setSelectedBodyShape("Hourglass");
      setHeight("172"); setWeight("62"); setAge("24");
      setBellyShape("average"); setHipShape("average"); setChestSize("average"); setNickname("");
      setAdvanced({ ...DEFAULT_MEASUREMENTS });
    }
    setIsWizardActive(true);
    setWizardStep(1);
  };

  // Save to the active slot
  const saveMannequin = (updatedNickname?: string) => {
    const finalBodyShape = selectedBodyShape || (gender === "woman" ? "Hourglass" : "Trapezium");
    const finalNickname = updatedNickname || nickname || `${gender === "woman" ? "Marwa" : "Amine"}_${finalBodyShape}`;
    const newSlot: MannequinSlot = {
      id: activeSlot,
      gender,
      height: height || "172",
      weight: weight || "62",
      age: age || "24",
      bodyShape: finalBodyShape,
      bellyShape, hipShape, chestSize,
      nickname: finalNickname,
      advanced,
    };
    const updated = [...slots];
    updated[activeSlot] = newSlot;
    setSlots(updated);
    localStorage.setItem(`mannequin_slot_${activeSlot}`, JSON.stringify(newSlot));
    localStorage.setItem("mannequin_body_shape", finalBodyShape);
    
    // Legacy key for backward compat (slot 0 only)
    if (activeSlot === 0) {
      localStorage.setItem("has_mannequin", "true");
      localStorage.setItem("mannequin_gender", gender);
      localStorage.setItem("mannequin_height", height || "172");
      localStorage.setItem("mannequin_weight", weight || "62");
      localStorage.setItem("mannequin_nickname", finalNickname);
    }
    setNickname(finalNickname);
    setHasMannequin(true);

    // Sync to SQLite database
    saveMutation.mutate({
      slot: activeSlot + 1,
      name: finalNickname,
      gender,
      height: Number(height || 172),
      weight: Number(weight || 62),
      bodyShape: finalBodyShape,
      bust: Number(advanced.bust),
      waist: Number(advanced.body),
      hips: Number(advanced.legs),
    }, {
      onSuccess: () => {
        refetch();
      }
    });
  };

  const handleNextStep = () => {
    if (wizardStep === 1) {
      // Set default shape if not selected yet when switching gender
      if (gender === "man" && !MALE_BODY_SHAPES.some(s => s.id === selectedBodyShape)) {
        setSelectedBodyShape("Trapezium");
      } else if (gender === "woman" && !FEMALE_BODY_SHAPES.some(s => s.id === selectedBodyShape)) {
        setSelectedBodyShape("Hourglass");
      }
      setWizardStep(2);
    } else if (wizardStep === 2) {
      setWizardStep(3);
    } else if (wizardStep === 3) {
      saveMannequin();
      setIsWizardActive(false);
      toast.success("Mannequin created successfully!");
    }
  };

  const handleBackStep = () => {
    if (wizardStep > 1) {
      setWizardStep((prev) => (prev - 1) as Step);
    } else {
      setIsWizardActive(false);
    }
  };

  const handleSkipWizard = () => {
    saveMannequin(gender === "woman" ? "Marwa_68kg" : "Amine");
    setIsWizardActive(false);
    toast.success("Mannequin setup skipped & auto-saved!");
  };

  const handleClearAdvanced = () => {
    setAdvanced(DEFAULT_MEASUREMENTS);
    toast.info("Cleared advanced dimensions");
  };

  const handleSaveAdvanced = () => {
    localStorage.setItem("mannequin_advanced", JSON.stringify(advanced));
    setActiveSubScreen(null);
    toast.success("Advanced dimensions updated");
  };

  // ─── SVG Dynamic Morphing Mannequin ───
  const renderInteractiveSVG = () => {
    const isWoman = gender === "woman";
    
    // Morph scale factors based on selected body shape
    let bellyScale = 1.0;
    let hipScale = 1.0;
    let chestScale = 1.0;

    if (isWoman) {
      if (selectedBodyShape === "Petite") { chestScale = 0.85; bellyScale = 0.85; hipScale = 0.85; }
      else if (selectedBodyShape === "Column") { chestScale = 0.9; bellyScale = 0.95; hipScale = 0.95; }
      else if (selectedBodyShape === "Inverted Triangle") { chestScale = 1.25; bellyScale = 0.9; hipScale = 0.8; }
      else if (selectedBodyShape === "Apple") { chestScale = 1.15; bellyScale = 1.25; hipScale = 0.9; }
      else if (selectedBodyShape === "Brick") { chestScale = 1.1; bellyScale = 1.1; hipScale = 1.05; }
      else if (selectedBodyShape === "Pear") { chestScale = 0.85; bellyScale = 1.0; hipScale = 1.3; }
      else if (selectedBodyShape === "Hourglass") { chestScale = 1.15; bellyScale = 0.8; hipScale = 1.2; }
      else if (selectedBodyShape === "Full Hourglass") { chestScale = 1.3; bellyScale = 0.85; hipScale = 1.35; }
    } else {
      if (selectedBodyShape === "Column") { chestScale = 0.85; bellyScale = 0.9; hipScale = 0.9; }
      else if (selectedBodyShape === "Trapezium") { chestScale = 1.2; bellyScale = 0.9; hipScale = 0.95; }
      else if (selectedBodyShape === "Circle") { chestScale = 1.05; bellyScale = 1.3; hipScale = 1.05; }
      else if (selectedBodyShape === "Oval") { chestScale = 1.1; bellyScale = 1.25; hipScale = 1.0; }
      else if (selectedBodyShape === "Rectangle") { chestScale = 1.05; bellyScale = 1.05; hipScale = 1.05; }
      else if (selectedBodyShape === "Square") { chestScale = 1.25; bellyScale = 1.1; hipScale = 1.15; }
      else if (selectedBodyShape === "Inverted Triangle") { chestScale = 1.35; bellyScale = 0.8; hipScale = 0.85; }
      else if (selectedBodyShape === "Triangle") { chestScale = 0.85; bellyScale = 1.1; hipScale = 1.25; }
    }

    // Height & weight dimensions
    const hVal = Number(height) || 172;
    const wVal = Number(weight) || 62;
    const heightFactor = Math.max(0.9, Math.min(1.15, hVal / 175));
    const widthFactor = Math.max(0.85, Math.min(1.2, wVal / 70));

    // Dynamic paths for Woman vs Man
    const womanBodyPath = `
      M 50 30 
      Q ${50 - 15 * widthFactor * chestScale} 42, ${50 - 10 * widthFactor * chestScale} 55 
      Q ${50 - 8 * widthFactor * bellyScale} 75, ${50 - 13 * widthFactor * bellyScale} 90 
      Q ${50 - 22 * widthFactor * hipScale} 108, ${50 - 15 * widthFactor * hipScale} 130 
      L ${50 + 15 * widthFactor * hipScale} 130 
      Q ${50 + 22 * widthFactor * hipScale} 108, ${50 + 13 * widthFactor * bellyScale} 90 
      Q ${50 + 8 * widthFactor * bellyScale} 75, ${50 + 10 * widthFactor * chestScale} 55 
      Q ${50 + 15 * widthFactor * chestScale} 42, 50 30 Z
    `;

    const manBodyPath = `
      M 50 28 
      Q ${50 - 18 * widthFactor * chestScale} 38, ${50 - 16 * widthFactor * chestScale} 52 
      Q ${50 - 13 * widthFactor * bellyScale} 72, ${50 - 11 * widthFactor * bellyScale} 92 
      Q ${50 - 15 * widthFactor * hipScale} 112, ${50 - 12 * widthFactor * hipScale} 130 
      L ${50 + 12 * widthFactor * hipScale} 130 
      Q ${50 + 15 * widthFactor * hipScale} 112, ${50 + 11 * widthFactor * bellyScale} 92 
      Q ${50 + 13 * widthFactor * bellyScale} 72, ${50 + 16 * widthFactor * chestScale} 52 
      Q ${50 + 18 * widthFactor * chestScale} 38, 50 28 Z
    `;

    return (
      <svg
        className="w-full h-full max-h-[380px] drop-shadow-xl text-neutral-400 dark:text-neutral-500 fill-current transition-all duration-300"
        viewBox="0 0 100 160"
      >
        {/* Head */}
        <circle cx="50" cy="14" r="7" className="fill-muted-foreground/30" />
        {/* Neck */}
        <rect x="48" y="21" width="4" height="6" className="fill-muted-foreground/30" />
        
        {/* Torso */}
        <path
          d={isWoman ? womanBodyPath : manBodyPath}
          className="fill-primary/20 stroke-primary/40 stroke-2"
        />

        {/* Dynamic underwear style overlay */}
        {isWoman ? (
          <>
            {/* Top */}
            <path
              d={`M ${50 - 11 * widthFactor * chestScale} 48 L ${50 + 11 * widthFactor * chestScale} 48 L ${50 + 9 * widthFactor * chestScale} 60 L ${50 - 9 * widthFactor * chestScale} 60 Z`}
              className="fill-foreground/90 dark:fill-background"
            />
            {/* Bottom */}
            <path
              d={`M ${50 - 12 * widthFactor * bellyScale} 95 L ${50 + 12 * widthFactor * bellyScale} 95 L ${50 + 14 * widthFactor * hipScale} 112 Q 50 118, ${50 - 14 * widthFactor * hipScale} 112 Z`}
              className="fill-foreground/90 dark:fill-background"
            />
          </>
        ) : (
          /* Swim trunks */
          <path
            d={`M ${50 - 11 * widthFactor * bellyScale} 90 L ${50 + 11 * widthFactor * bellyScale} 90 L ${50 + 12 * widthFactor * hipScale} 118 L ${50 + 2 * widthFactor * hipScale} 118 L 50 100 L ${50 - 2 * widthFactor * hipScale} 118 L ${50 - 12 * widthFactor * hipScale} 118 Z`}
            className="fill-blue-600/90 dark:fill-blue-500"
          />
        )}
      </svg>
    );
  };

  return (
    <AppShell activePath="/mannequin" showRightPanel={false}>
      <div className="pb-20 lg:pb-6">

      {/* ── Wizard Setup Overlay Mode ── */}
      {isWizardActive ? (
        <div className="fixed inset-0 z-50 bg-[#F6F6F6] dark:bg-[#121212] flex flex-col">
          {/* Wizard Header */}
          <div className="px-5 py-4 border-b border-border/40 flex items-center justify-between bg-white/70 dark:bg-[#1A1A1A]/70 glassmorphic">
            <button onClick={handleBackStep} className="h-8 w-8 rounded-full hover:bg-accent flex items-center justify-center">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-muted-foreground">Step {wizardStep} of 3</span>
              <div className="flex gap-1 h-1.5 w-16 bg-muted rounded-full overflow-hidden">
                <div
                  className="bg-primary h-full transition-all duration-300"
                  style={{ width: `${(wizardStep / 3) * 100}%` }}
                />
              </div>
            </div>
            <button onClick={handleSkipWizard} className="text-xs font-bold text-muted-foreground hover:text-foreground">
              Skip
            </button>
          </div>

          {/* Wizard Body Content */}
          <div className="flex-1 overflow-y-auto px-5 py-6 max-w-md mx-auto w-full flex flex-col justify-between">
            <div className="space-y-6">
              
              {/* Step 1: Gender Selection */}
              {wizardStep === 1 && (
                <div className="space-y-6 text-center">
                  <div className="h-56 flex items-center justify-center gap-4">
                    <div
                      onClick={() => setGender("woman")}
                      className={`relative h-52 w-28 rounded-2xl overflow-hidden cursor-pointer border-2 transit-all ${
                        gender === "woman" ? "border-primary shadow-lg shadow-primary/25 scale-105" : "border-transparent opacity-60 hover:opacity-80"
                      }`}
                    >
                      <img src="/mannequin_female.png" alt="Female model" className="w-full h-full object-cover object-top" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                      <p className="absolute bottom-2 left-0 right-0 text-center text-xs font-bold text-white">Woman</p>
                      {gender === "woman" && (
                        <div className="absolute top-2 right-2 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                          <CheckCircle className="h-3 w-3 text-white fill-white" />
                        </div>
                      )}
                    </div>
                    <div
                      onClick={() => setGender("man")}
                      className={`relative h-52 w-28 rounded-2xl overflow-hidden cursor-pointer border-2 transit-all ${
                        gender === "man" ? "border-primary shadow-lg shadow-primary/25 scale-105" : "border-transparent opacity-60 hover:opacity-80"
                      }`}
                    >
                      <img src="/mannequin_male.png" alt="Male model" className="w-full h-full object-cover object-top" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                      <p className="absolute bottom-2 left-0 right-0 text-center text-xs font-bold text-white">Man</p>
                      {gender === "man" && (
                        <div className="absolute top-2 right-2 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                          <CheckCircle className="h-3 w-3 text-white fill-white" />
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-2xl font-black tracking-tight">Select Mannequin Model</h2>
                    <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                      Choose your model type. You will select your body shape in the next step.
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setGender("man")}
                      className={`flex-1 h-12 rounded-xl font-bold text-sm border-2 transition-all ${
                        gender === "man" ? "border-primary bg-primary/5 text-primary" : "border-border/60 hover:bg-accent"
                      }`}
                    >
                      Man
                    </button>
                    <button
                      onClick={() => setGender("woman")}
                      className={`flex-1 h-12 rounded-xl font-bold text-sm border-2 transition-all ${
                        gender === "woman" ? "border-primary bg-primary/5 text-primary" : "border-border/60 hover:bg-accent"
                      }`}
                    >
                      Woman
                    </button>
                  </div>
                </div>
              )}

              {/* Step 2: Select Body Shape */}
              {wizardStep === 2 && (
                <div className="space-y-5 text-center">
                  <div className="space-y-1">
                    <h2 className="text-xl font-black tracking-tight">Choose Body Shape</h2>
                    <p className="text-xs text-muted-foreground">Select the silhouette matching your body structure</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5 max-h-[380px] overflow-y-auto p-1">
                    {(gender === "woman" ? FEMALE_BODY_SHAPES : MALE_BODY_SHAPES).map((shape) => {
                      const isSelected = selectedBodyShape === shape.id;
                      return (
                        <div
                          key={shape.id}
                          onClick={() => setSelectedBodyShape(shape.id)}
                          className={`p-3 rounded-2xl border-2 text-left cursor-pointer transition-all flex flex-col justify-between ${
                            isSelected
                              ? "border-primary bg-primary/10 shadow-md shadow-primary/15 scale-[1.02]"
                              : "border-border/40 bg-muted/40 hover:border-primary/40 hover:bg-accent"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-bold text-foreground">{shape.name}</span>
                            {isSelected && (
                              <div className="h-4 w-4 rounded-full bg-primary flex items-center justify-center shrink-0">
                                <CheckCircle className="h-2.5 w-2.5 text-white fill-white" />
                              </div>
                            )}
                          </div>
                          <p className="text-[10px] text-muted-foreground leading-tight">{shape.desc}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Step 3: Optional Measurements & Nickname */}
              {wizardStep === 3 && (
                <div className="space-y-5 text-center">
                  <div className="space-y-1">
                    <h2 className="text-xl font-black tracking-tight">Mannequin Details (Optional)</h2>
                    <p className="text-xs text-muted-foreground">Enter optional dimensions or give your mannequin a nickname</p>
                  </div>

                  <div className="space-y-3.5 text-left">
                    <div>
                      <label className="text-xs font-bold block mb-1 text-muted-foreground">Nickname</label>
                      <input
                        type="text"
                        placeholder={gender === "woman" ? "e.g. Marwa, Style_Look" : "e.g. Amine, Casual_Look"}
                        value={nickname}
                        onChange={(e) => setNickname(e.target.value)}
                        className="w-full h-11 px-4 rounded-xl bg-muted border border-border/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-bold block mb-1 text-muted-foreground">Height (cm)</label>
                        <input
                          type="number"
                          placeholder="172"
                          value={height}
                          onChange={(e) => setHeight(e.target.value)}
                          className="w-full h-11 px-4 rounded-xl bg-muted border border-border/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold block mb-1 text-muted-foreground">Weight (kg)</label>
                        <input
                          type="number"
                          placeholder="62"
                          value={weight}
                          onChange={(e) => setWeight(e.target.value)}
                          className="w-full h-11 px-4 rounded-xl bg-muted border border-border/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                        />
                      </div>
                    </div>
                  </div>

                  <p className="text-[11px] text-muted-foreground pt-2">
                    💡 You can adjust detailed bust, waist, & hip measurements anytime from your mannequin settings.
                  </p>
                </div>
              )}

            </div>

            <button
              onClick={handleNextStep}
              className="w-full h-12 mt-6 rounded-full bg-gradient-to-r from-red-500 to-orange-500 text-white font-bold text-sm hover:opacity-90 active:scale-[0.98] transition-all shadow-lg shadow-orange-500/20 flex items-center justify-center gap-1.5"
            >
              {wizardStep === 3 ? "Create Mannequin 🎉" : "Next"} <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : null}

      {/* ── Main View (Has Mannequin vs Empty State) ── */}
      {!isWizardActive && (
        <main className="max-w-md mx-auto px-4 py-6">
          {!hasMannequin ? (
            /* Empty State View (4.jpeg) */
            <div className="flex flex-col items-center justify-center py-20 px-4 text-center space-y-8">
              <div className="h-44 flex items-center justify-center opacity-75">
                <img src="/logo.png" className="h-28 object-contain filter saturate-50" alt="Blank mannequin group" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-black tracking-tight">You don't have a mannequin yet</h2>
                <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                  Create your mannequin, so that we can get you outfits tailored to your body.
                </p>
              </div>
              <button
                onClick={() => handleCreateMannequin(0)}
                className="px-8 h-12 rounded-full border-2 border-primary text-primary font-bold text-sm hover:bg-primary hover:text-white transition-all shadow-md shadow-primary/5 active:scale-95"
              >
                Create my mannequin
              </button>
            </div>
          ) : (
            /* Created Mannequin Overview View */
            <div className="space-y-6">
              
              {/* ── Slot Switcher Row ── */}
              <div className="flex gap-3 overflow-x-auto pb-1">
                {[0, 1, 2].map((idx) => {
                  const slot = slots[idx];
                  const isFilled = slot !== null;
                  const isActive = idx === activeSlot;

                  if (isFilled) {
                    return (
                      <div
                        key={idx}
                        onClick={() => switchSlot(idx)}
                        className={`relative flex-shrink-0 w-28 h-36 rounded-2xl overflow-hidden cursor-pointer border-2 transition-all ${
                          isActive ? "border-primary shadow-lg shadow-primary/20 scale-105" : "border-border/30 opacity-70 hover:opacity-90"
                        }`}
                      >
                        <img
                          src={slot!.gender === "woman" ? "/mannequin_female.png" : "/mannequin_male.png"}
                          alt={slot!.nickname}
                          className="w-full h-full object-cover object-top"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                        <p className="absolute bottom-2 left-0 right-0 text-center text-[10px] font-bold text-white px-1 truncate">{slot!.nickname || "My Look"}</p>
                        {isActive && (
                          <div className="absolute top-2 left-2 h-4 w-4 rounded-full bg-primary flex items-center justify-center">
                            <CheckCircle className="h-2.5 w-2.5 text-white fill-white" />
                          </div>
                        )}
                        {idx > 0 && (
                          <button
                            onClick={(e) => { e.stopPropagation(); deleteSlot(idx); }}
                            className="absolute top-2 right-2 h-5 w-5 rounded-full bg-black/60 hover:bg-red-500 flex items-center justify-center transition-colors"
                          >
                            <X className="h-2.5 w-2.5 text-white" />
                          </button>
                        )}
                      </div>
                    );
                  }

                  // Empty slot — show Add button (only if previous slot is filled)
                  const prevFilled = idx === 0 || slots[idx - 1] !== null;
                  if (!prevFilled) return null;

                  return (
                    <button
                      key={idx}
                      onClick={() => handleCreateMannequin(idx)}
                      className="flex-shrink-0 w-28 h-36 rounded-2xl border-2 border-dashed border-primary/30 hover:border-primary/60 bg-primary/3 hover:bg-primary/6 flex flex-col items-center justify-center gap-1.5 transition-all"
                    >
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Plus className="h-4 w-4 text-primary" />
                      </div>
                      <p className="text-[10px] font-bold text-primary">Add</p>
                    </button>
                  );
                })}
              </div>

              {/* Mannequin Card */}
              <div className="bg-white dark:bg-[#1A1A1A] border border-border/40 rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-extrabold text-base flex items-center gap-1.5 text-primary">
                      <Sparkles className="h-4 w-4" /> {nickname || "My Look"}
                    </h3>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {gender === "woman" ? "Woman Model" : "Man Model"} • {height}cm • {weight}kg
                    </p>
                  </div>
                  <button
                    onClick={() => handleCreateMannequin(activeSlot)}
                    className="text-xs font-bold text-muted-foreground hover:text-foreground border border-border/60 px-3 py-1.5 rounded-full"
                  >
                    Recreate
                  </button>
                </div>


                <div className="h-80 bg-gradient-to-b from-muted/30 to-muted/10 rounded-2xl flex items-center justify-center relative overflow-hidden border border-border/20">
                  {/* Real mannequin photo */}
                  <img
                    src={gender === "woman" ? "/mannequin_female.png" : "/mannequin_male.png"}
                    alt={nickname}
                    className="h-full w-auto object-cover object-top drop-shadow-xl"
                  />
                  {/* Measurement overlays */}
                  <div className="absolute top-3 left-3 bg-white/90 dark:bg-[#1A1A1A]/90 backdrop-blur-sm border border-border/40 rounded-xl px-2.5 py-1.5 shadow-sm">
                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wide">Height</p>
                    <p className="text-sm font-black text-primary">{height} cm</p>
                  </div>
                  <div className="absolute top-3 right-3 bg-white/90 dark:bg-[#1A1A1A]/90 backdrop-blur-sm border border-border/40 rounded-xl px-2.5 py-1.5 shadow-sm">
                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wide">Weight</p>
                    <p className="text-sm font-black text-primary">{weight} kg</p>
                  </div>
                  <div className="absolute bottom-3 left-3 bg-white/90 dark:bg-[#1A1A1A]/90 backdrop-blur-sm border border-border/40 rounded-xl px-2.5 py-1.5 shadow-sm">
                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wide">Chest</p>
                    <p className="text-xs font-bold capitalize text-foreground">{chestSize}</p>
                  </div>
                  <div className="absolute bottom-3 right-3 bg-white/90 dark:bg-[#1A1A1A]/90 backdrop-blur-sm border border-border/40 rounded-xl px-2.5 py-1.5 shadow-sm">
                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wide">Hip</p>
                    <p className="text-xs font-bold capitalize text-foreground">{hipShape}</p>
                  </div>
                  {/* Gradient fade at bottom */}
                  <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-muted/30 to-transparent" />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setShowAdvancedPanel(true)}
                    className="flex-1 h-11 rounded-full border border-border/60 text-xs font-bold hover:bg-accent transition-all"
                  >
                    Body Measurements
                  </button>
                  <button
                    onClick={() => setLocation("/feed")}
                    className="flex-1 h-11 rounded-full bg-primary text-white text-xs font-bold hover:bg-primary/95 transition-all shadow-sm"
                  >
                    View Matching Outfits
                  </button>
                </div>
              </div>

              {/* Quick Info Box */}
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 text-xs flex gap-3">
                <Shirt className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-primary">Mannequin customizer synced</p>
                  <p className="text-muted-foreground mt-0.5">
                    Your virtual body double will now show accurate fit recommendations across all Styly products.
                  </p>
                </div>
              </div>
            </div>
          )}
        </main>
      )}

      {/* ── Body Measurements List Panel (2.jpeg) ── */}
      {showAdvancedPanel && !activeSubScreen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowAdvancedPanel(false)} />
          <div className="relative w-full sm:max-w-md bg-white dark:bg-[#1A1A1A] rounded-t-3xl sm:rounded-2xl shadow-2xl border border-border/60 max-h-[85vh] flex flex-col animate-in slide-in-from-bottom-4 duration-300">
            
            {/* Header */}
            <div className="px-5 pt-5 pb-4 border-b border-border/40 flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-lg font-bold">Body Measurements</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Define exact sizes for perfect tailoring</p>
              </div>
              <button onClick={() => setShowAdvancedPanel(false)} className="h-8 w-8 rounded-full hover:bg-accent flex items-center justify-center">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* List Body */}
            <div className="overflow-y-auto p-5 space-y-4 flex-1">
              <div className="p-3.5 rounded-xl bg-muted/30 border border-border/30 flex justify-between items-center">
                <span className="text-xs font-extrabold text-foreground/90">{nickname}</span>
                <span className="text-[10px] bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full font-bold">Default</span>
              </div>

              <div className="divide-y divide-border/30">
                {Object.keys(DEFAULT_MEASUREMENTS).map((key) => (
                  <button
                    key={key}
                    onClick={() => setActiveSubScreen(key)}
                    className="w-full flex items-center justify-between py-3.5 hover:bg-accent/40 px-2 rounded-lg transition-colors text-left"
                  >
                    <span className="text-xs font-semibold capitalize">{key}</span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      {key === "head" ? `${advanced.head.forehead} cm` : `${(advanced as any)[key]} cm`} <ChevronRight className="h-4 w-4" />
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="p-5 border-t border-border/40 flex gap-3 shrink-0">
              <button
                onClick={handleClearAdvanced}
                className="flex-1 h-12 rounded-full border border-border/60 text-xs font-bold hover:bg-accent transition-all"
              >
                Clear all
              </button>
              <button
                onClick={() => {
                  saveMannequin();
                  setShowAdvancedPanel(false);
                  toast.success("Measurements saved!");
                }}
                className="flex-1 h-12 rounded-full bg-primary text-white text-xs font-bold hover:bg-primary/95 transition-all shadow-sm"
              >
                Done
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ── Head Specific Details Input Sub-screen (3.jpeg) ── */}
      {showAdvancedPanel && activeSubScreen === "head" && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setActiveSubScreen(null)} />
          <div className="relative w-full sm:max-w-md bg-white dark:bg-[#1A1A1A] rounded-t-3xl sm:rounded-2xl shadow-2xl border border-border/60 max-h-[85vh] flex flex-col animate-in slide-in-from-bottom-4 duration-300">
            
            {/* Sub-screen Header */}
            <div className="px-5 pt-5 pb-4 border-b border-border/40 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <button onClick={() => setActiveSubScreen(null)} className="h-7 w-7 rounded-full hover:bg-accent flex items-center justify-center">
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <h2 className="text-base font-bold capitalize">Head Dimensions</h2>
              </div>
              <button onClick={() => setAdvanced({ ...advanced, head: { forehead: "", ears: "", nape: "" } })} className="p-1.5 hover:bg-accent rounded-full" title="Reset">
                <RotateCcw className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>

            {/* Inputs Body */}
            <div className="overflow-y-auto p-5 space-y-5 flex-1">
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold block mb-1 text-muted-foreground">1. Forehead Circumference</label>
                  <div className="relative">
                    <input
                      type="number"
                      placeholder="56"
                      value={advanced.head.forehead}
                      onChange={(e) => setAdvanced({ ...advanced, head: { ...advanced.head, forehead: e.target.value } })}
                      className="w-full h-11 px-4 rounded-xl bg-muted border border-border/50 text-sm focus:outline-none"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">cm</span>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold block mb-1 text-muted-foreground">2. Over Ears Circumference</label>
                  <div className="relative">
                    <input
                      type="number"
                      placeholder="57"
                      value={advanced.head.ears}
                      onChange={(e) => setAdvanced({ ...advanced, head: { ...advanced.head, ears: e.target.value } })}
                      className="w-full h-11 px-4 rounded-xl bg-muted border border-border/50 text-sm focus:outline-none"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">cm</span>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold block mb-1 text-muted-foreground">3. Nape Circumference</label>
                  <div className="relative">
                    <input
                      type="number"
                      placeholder="55"
                      value={advanced.head.nape}
                      onChange={(e) => setAdvanced({ ...advanced, head: { ...advanced.head, nape: e.target.value } })}
                      className="w-full h-11 px-4 rounded-xl bg-muted border border-border/50 text-sm focus:outline-none"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">cm</span>
                  </div>
                </div>
              </div>

              {/* Head Measurement Diagram — real mannequin head crop */}
              <div className="rounded-2xl bg-muted/20 border border-border/40 overflow-hidden">
                <div className="relative h-44 w-full overflow-hidden">
                  <img
                    src={gender === "man" ? "/mannequin_measure_head.jpg" : "/mannequin_measure_head.jpg"}
                    alt="Head measurement reference"
                    className="w-full h-full object-cover"
                    style={{ objectPosition: "center 30%" }}
                  />
                  {/* Measurement lines overlay */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <svg viewBox="0 0 200 160" className="w-full h-full opacity-60">
                      {/* Forehead arc */}
                      <path d="M 50 55 Q 100 35 150 55" fill="none" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="4 2" />
                      <text x="100" y="32" textAnchor="middle" fill="#ef4444" fontSize="8" fontWeight="bold">1. Forehead</text>
                      {/* Over-ears circumference */}
                      <ellipse cx="100" cy="72" rx="52" ry="38" fill="none" stroke="#f97316" strokeWidth="1.5" strokeDasharray="4 2" />
                      <text x="160" y="72" fill="#f97316" fontSize="7" fontWeight="bold">2. Ears</text>
                      {/* Nape line */}
                      <path d="M 58 100 Q 100 115 142 100" fill="none" stroke="#8b5cf6" strokeWidth="1.5" strokeDasharray="4 2" />
                      <text x="100" y="130" textAnchor="middle" fill="#8b5cf6" fontSize="8" fontWeight="bold">3. Nape</text>
                    </svg>
                  </div>
                </div>
                <div className="flex justify-around p-3">
                  {[
                    { num: "1", label: "Forehead", color: "#ef4444" },
                    { num: "2", label: "Over Ears", color: "#f97316" },
                    { num: "3", label: "Nape", color: "#8b5cf6" },
                  ].map((item) => (
                    <div key={item.num} className="flex flex-col items-center gap-1">
                      <div className="h-7 w-7 rounded-full flex items-center justify-center text-white text-xs font-black" style={{ background: item.color }}>{item.num}</div>
                      <span className="text-[10px] font-bold text-muted-foreground">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sub-screen Footer */}
            <div className="p-5 border-t border-border/40 flex gap-3 shrink-0">
              <button
                onClick={() => setAdvanced({ ...advanced, head: { forehead: "", ears: "", nape: "" } })}
                className="flex-1 h-12 rounded-full border border-border/60 text-xs font-bold hover:bg-accent transition-all"
              >
                Clear all
              </button>
              <button
                onClick={handleSaveAdvanced}
                className="flex-1 h-12 rounded-full bg-primary text-white text-xs font-bold hover:bg-primary/95 transition-all shadow-sm"
              >
                Done
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ── Standard Drill-down Sub-screens fallback (Shoulders, Bust, etc.) ── */}
      {showAdvancedPanel && activeSubScreen && activeSubScreen !== "head" && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setActiveSubScreen(null)} />
          <div className="relative w-full sm:max-w-md bg-white dark:bg-[#1A1A1A] rounded-t-3xl sm:rounded-2xl shadow-2xl border border-border/60 max-h-[85vh] flex flex-col animate-in slide-in-from-bottom-4 duration-300">
            
            {/* Header */}
            <div className="px-5 pt-5 pb-4 border-b border-border/40 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <button onClick={() => setActiveSubScreen(null)} className="h-7 w-7 rounded-full hover:bg-accent flex items-center justify-center">
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <h2 className="text-base font-bold capitalize">{activeSubScreen} Size</h2>
              </div>
              <button onClick={() => setAdvanced({ ...advanced, [activeSubScreen]: "" })} className="p-1.5 hover:bg-accent rounded-full" title="Reset">
                <RotateCcw className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>

            {/* Inputs Body */}
            <div className="overflow-y-auto p-5 space-y-5 flex-1">
              <div>
                <label className="text-xs font-bold block mb-1 text-muted-foreground capitalize">{activeSubScreen} Circumference / Length</label>
                <div className="relative">
                  <input
                    type="number"
                    placeholder={(DEFAULT_MEASUREMENTS as any)[activeSubScreen]}
                    value={(advanced as any)[activeSubScreen]}
                    onChange={(e) => setAdvanced({ ...advanced, [activeSubScreen]: e.target.value })}
                    className="w-full h-11 px-4 rounded-xl bg-muted border border-border/50 text-sm focus:outline-none"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">cm</span>
                </div>
              </div>

              {/* Mannequin photo crop guide — zooms into relevant body region */}
              {(() => {
                // Per-body-part specific measurement photos
                const partPhotoMap: Record<string, { src: string; label: string; svgOverlay?: React.ReactNode }> = {
                  shoulders: {
                    src: "/mannequin_measure_shoulders.jpg",
                    label: "Measure straight across from one shoulder tip to the other",
                  },
                  bust: {
                    src: "/mannequin_measure_bust.jpg",
                    label: "Wrap tape around the fullest part of the chest/bust, keeping level",
                  },
                  body: {
                    src: "/mannequin_measure_body.jpg",
                    label: "Measure around the narrowest part of the torso (natural waist)",
                  },
                  legs: {
                    src: gender === "woman" ? "/mannequin_female.png" : "/mannequin_male.png",
                    label: "Wrap tape around the fullest part of the hips, about 20 cm below the waist",
                  },
                  foot: {
                    src: gender === "woman" ? "/mannequin_female.png" : "/mannequin_male.png",
                    label: "Measure around the widest part of the foot (ball of foot)",
                  },
                };

                const part = partPhotoMap[activeSubScreen] ?? partPhotoMap["body"];

                // Crop config for legs/foot (they use the full body image zoomed in)
                const cropConfig: Record<string, { pos: string; scale: string }> = {
                  legs: { pos: gender === "woman" ? "center 72%" : "center 68%", scale: "scale(2.2) translateY(28%)" },
                  foot: { pos: "center 100%", scale: "scale(3) translateY(50%)" },
                };
                const crop = cropConfig[activeSubScreen];

                return (
                  <div className="rounded-2xl bg-muted/20 border border-border/40 overflow-hidden">
                    <div className="relative h-52 w-full overflow-hidden">
                      <img
                        src={part.src}
                        alt={`${activeSubScreen} measurement reference`}
                        className="w-full h-full object-cover transition-all duration-500"
                        style={crop ? { objectPosition: crop.pos, transform: crop.scale } : { objectFit: "cover", objectPosition: "center 25%" }}
                      />
                      {/* Highlight band overlay */}
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-full h-8 border-t-2 border-b-2 border-dashed border-primary/80 bg-primary/10" />
                      </div>
                    </div>
                    <p className="text-[11px] text-muted-foreground text-center py-2.5 px-4 font-medium leading-relaxed">{part.label}</p>
                  </div>
                );
              })()}
            </div>

            {/* Footer */}
            <div className="p-5 border-t border-border/40 flex gap-3 shrink-0">
              <button
                onClick={() => setAdvanced({ ...advanced, [activeSubScreen]: "" })}
                className="flex-1 h-12 rounded-full border border-border/60 text-xs font-bold hover:bg-accent transition-all"
              >
                Clear all
              </button>
              <button
                onClick={handleSaveAdvanced}
                className="flex-1 h-12 rounded-full bg-primary text-white text-xs font-bold hover:bg-primary/95 transition-all shadow-sm"
              >
                Done
              </button>
            </div>

          </div>
        </div>
      )}
      </div>
    </AppShell>
  );
}
