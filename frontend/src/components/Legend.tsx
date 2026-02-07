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
    <div className="surface-elevated absolute bottom-24 right-4 z-10 rounded-xl px-4 py-3 shadow-card backdrop-blur-sm">
      <div className="space-y-3 text-xs">
        <div>
          <div className="mb-1 font-medium uppercase tracking-wider text-aurora-text2">
            Color
          </div>
          {showAgeEncoding && colorBy === "age" && (
            <div>
              <div className="mb-1 text-aurora-text1">Age</div>
              <div className="h-2 w-32 rounded" style={ageGradientStyle} />
              <div className="mt-0.5 flex justify-between text-aurora-text2">
                {AGE_COLOR_MIN} → {AGE_COLOR_MAX}
              </div>
            </div>
          )}
          {colorBy === "trait" && (
            <div>
              <div className="mb-1 text-aurora-text1">
                {selectedTrait || traitKeys[0] || "Trait"}
              </div>
              <div className="aurora-gradient h-2 w-32 rounded" />
              <div className="mt-0.5 flex justify-between text-aurora-text2">0 — 1</div>
            </div>
          )}
          {colorBy === "centrality" && (
            <div>
              <div className="aurora-gradient h-2 w-32 rounded" />
              <div className="mt-0.5 flex justify-between text-aurora-text2">Low — High</div>
            </div>
          )}
        </div>
        {showGenderEncoding && (
        <div>
          <div className="mb-1 font-medium uppercase tracking-wider text-aurora-text2">
            Shape (gender)
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full border border-aurora-text2" title="Male" />
              <span className="text-aurora-text1">Male</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 border border-aurora-text2" title="Female" style={{ borderRadius: 2 }} />
              <span className="text-aurora-text1">Female</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="inline-block h-0 w-0 border-l-[5px] border-r-[5px] border-b-[9px] border-l-transparent border-r-transparent border-b-aurora-text2" style={{ marginBottom: 2 }} title="Non-binary" />
              <span className="text-aurora-text1">Non-binary</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rotate-45 border border-aurora-text2" title="Unknown" />
              <span className="text-aurora-text1">Unknown</span>
            </div>
          </div>
        </div>
        )}
        <div>
          <div className="font-medium uppercase tracking-wider text-aurora-text2">Size</div>
          <div className="text-aurora-text1">
            {sizeBy === "degree" ? "Degree" : sizeBy === "level_of_care" ? "Level of care" : "Centrality"}
          </div>
        </div>
      </div>
    </div>
  );
}
