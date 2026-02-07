import { useUIStore } from "../store/useUIStore";
import { useGraphStore } from "../store/useGraphStore";
import { getAgeColor, AGE_COLOR_MIN, AGE_COLOR_MAX } from "../utils/color";

const ageGradientStyle = {
  background: `linear-gradient(to right, ${getAgeColor(AGE_COLOR_MIN)}, ${getAgeColor((AGE_COLOR_MIN + AGE_COLOR_MAX) / 2)}, ${getAgeColor(AGE_COLOR_MAX)})`,
};

export function Legend() {
  const colorBy = useUIStore((s) => s.colorBy);
  const sizeBy = useUIStore((s) => s.sizeBy);
  const selectedTrait = useUIStore((s) => s.selectedTrait);
  const traitKeys = useGraphStore((s) => s.traitKeys);
  const showAgeEncoding = useUIStore((s) => s.showAgeEncoding);
  const showGenderEncoding = useUIStore((s) => s.showGenderEncoding);

  return (
    <div className="absolute bottom-20 right-4 z-10 rounded-lg border border-aurora-border/50 bg-aurora-surface0/80 px-3 py-2 shadow-sm backdrop-blur-sm">
      <div className="space-y-2.5 text-[11px]">
        <div>
          <div className="mb-0.5 font-medium uppercase tracking-[0.1em] text-aurora-text2/90">
            Color
          </div>
          {showAgeEncoding && colorBy === "age" && (
            <div>
              <div className="mb-0.5 text-aurora-text1/90">Age</div>
              <div className="h-1.5 w-28 rounded" style={ageGradientStyle} />
              <div className="mt-0.5 flex justify-between text-aurora-text2/80">
                {AGE_COLOR_MIN} → {AGE_COLOR_MAX}
              </div>
            </div>
          )}
          {colorBy === "trait" && (
            <div>
              <div className="mb-0.5 text-aurora-text1/90">
                {selectedTrait || traitKeys[0] || "Trait"}
              </div>
              <div className="aurora-gradient h-1.5 w-28 rounded opacity-90" />
              <div className="mt-0.5 flex justify-between text-aurora-text2/80">0 — 1</div>
            </div>
          )}
          {colorBy === "centrality" && (
            <div>
              <div className="aurora-gradient h-1.5 w-28 rounded opacity-90" />
              <div className="mt-0.5 flex justify-between text-aurora-text2/80">Low — High</div>
            </div>
          )}
        </div>
        {showGenderEncoding && (
        <div>
          <div className="mb-0.5 font-medium uppercase tracking-[0.1em] text-aurora-text2/90">
            Shape (gender)
          </div>
          <div className="flex flex-wrap gap-x-2 gap-y-0.5">
            <div className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full border border-aurora-text2/80" title="Male" />
              <span className="text-aurora-text1/90">Male</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="h-2 w-2 border border-aurora-text2/80" title="Female" style={{ borderRadius: 2 }} />
              <span className="text-aurora-text1/90">Female</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="inline-block h-0 w-0 border-l-[4px] border-r-[4px] border-b-[7px] border-l-transparent border-r-transparent border-b-aurora-text2/80" style={{ marginBottom: 1 }} title="Non-binary" />
              <span className="text-aurora-text1/90">Non-binary</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="inline-block h-2 w-2 rotate-45 border border-aurora-text2/80" title="Unknown" />
              <span className="text-aurora-text1/90">Unknown</span>
            </div>
          </div>
        </div>
        )}
        <div>
          <div className="font-medium uppercase tracking-[0.1em] text-aurora-text2/90">Size</div>
          <div className="text-aurora-text1/90">
            {sizeBy === "degree" ? "Degree" : sizeBy === "level_of_care" ? "Level of care" : "Centrality"}
          </div>
        </div>
      </div>
    </div>
  );
}
