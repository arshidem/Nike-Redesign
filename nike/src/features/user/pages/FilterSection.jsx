import React from "react";
import { XIcon } from "../../../shared/ui/Icons";

const FilterSection = ({
  title,
  options,
  selectedValues = [],
  onChange,
  type = "checkbox",
  isCollapsible = false,
  onClear,
}) => {
  const [isOpen, setIsOpen] = React.useState(!isCollapsible);

  const handleChange = (value, isChecked) => {
    if (type === "radio" || type === "color-swatch") {
      onChange([value]);
    } else {
      const newValues = isChecked
        ? [...selectedValues, value]
        : selectedValues.filter((v) => v !== value);
      onChange(newValues);
    }
  };

  const handleRangeChange = (min, max) => {
    onChange([min, max]);
  };

  const toggleSection = () => {
    if (isCollapsible) {
      setIsOpen(!isOpen);
    }
  };

  return (
    <div className="border-b border-gray-200 py-4">
      {isCollapsible ? (
        <button
          onClick={toggleSection}
          className="flex justify-between items-center w-full text-left"
        >
          <h3 className="text-lg font-medium">{title}</h3>
          <span className="text-gray-500">
            {isOpen ? (
              <svg
                className="h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z"
                  clipRule="evenodd"
                />
              </svg>
            ) : (
              <svg
                className="h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </span>
        </button>
      ) : (
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium">{title}</h3>
          {onClear && (
            <button
              onClick={onClear}
              className="text-sm text-gray-500 hover:text-black"
            >
              Clear
            </button>
          )}
        </div>
      )}

      {isOpen && (
        <div className="mt-2 space-y-2">
          {type === "range" ? (
            <div className="space-y-4">
              <div className="flex justify-between">
                <span>${selectedValues?.[0] || options?.[0] || 0}</span>
                <span>${selectedValues?.[1] || options?.[1] || 1000}</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="range"
                  min={options?.[0] || 0}
                  max={options?.[1] || 1000}
                  value={selectedValues?.[0] || options?.[0] || 0}
                  onChange={(e) =>
                    handleRangeChange(
                      Number(e.target.value),
                      selectedValues?.[1] || options?.[1] || 1000
                    )
                  }
                  className="w-full"
                />
                <input
                  type="range"
                  min={options?.[0] || 0}
                  max={options?.[1] || 1000}
                  value={selectedValues?.[1] || options?.[1] || 1000}
                  onChange={(e) =>
                    handleRangeChange(
                      selectedValues?.[0] || options?.[0] || 0,
                      Number(e.target.value)
                    )
                  }
                  className="w-full"
                />
              </div>
            </div>
          ) : type === "color-swatch" ? (
            <div className="grid grid-cols-4 gap-2">
              {options.map((color) => {
                const normalizedColor = color
                  .toLowerCase()
                  .replace(/\s+/g, "-");
                const isSelected = selectedValues.includes(normalizedColor);

                return (
                  <label
                    key={color}
                    className={`relative rounded-full w-8 h-8 border-2 ${
                      isSelected ? "border-black" : "border-transparent"
                    }`}
                    style={{
                      backgroundColor: getColorValue(normalizedColor),
                    }}
                  >
                    <input
                      type="radio"
                      name={title}
                      value={normalizedColor}
                      checked={isSelected}
                      onChange={() => handleChange(normalizedColor, true)}
                      className="absolute opacity-0 w-0 h-0"
                    />
                    {isSelected && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <XIcon className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </label>
                );
              })}
            </div>
          ) : (
            options.map((option) => {
              const isChecked = selectedValues.includes(option.value || option);

              return (
                <label
                  key={option.value || option}
                  className="flex items-center space-x-3"
                >
                  <input
                    type={type === "radio" ? "radio" : "checkbox"}
                    name={title}
                    value={option.value || option}
                    checked={isChecked}
                    onChange={(e) =>
                      handleChange(option.value || option, e.target.checked)
                    }
                    className={`h-4 w-4 text-black border-gray-300 focus:ring-black ${
                      type === "radio" ? "rounded-full" : "rounded"
                    }`}
                  />
                  <span className="text-sm">
                    {option.label || option}
                    {option.count !== undefined && (
                      <span className="text-gray-500 ml-1">
                        ({option.count})
                      </span>
                    )}
                  </span>
                </label>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

// Helper function to get color values for swatches
const getColorValue = (color) => {
  const colorMap = {
    black: "#000000",
    white: "#ffffff",
    red: "#ff0000",
    blue: "#0000ff",
    green: "#00ff00",
    yellow: "#ffff00",
    pink: "#ffc0cb",
    purple: "#800080",
    orange: "#ffa500",
    gray: "#808080",
    silver: "#c0c0c0",
    gold: "#ffd700",
    brown: "#a52a2a",
    navy: "#000080",
    teal: "#008080",
  };

  return colorMap[color] || "#cccccc";
};

export default FilterSection;
