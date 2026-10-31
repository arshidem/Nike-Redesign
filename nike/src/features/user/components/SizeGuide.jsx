import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  AnimatePresence,
  motion,
  useDragControls,
  useReducedMotion,
} from "framer-motion";
import {
  XMarkIcon,
  ArrowUpRightIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";

function GuideDialog({
  product,
  sizes,
  selectedSize,
  onSelect,
  onClose,
  returnFocusRef,
}) {
  const dialog = useRef(null);
  const drag = useDragControls();
  const reducedMotion = useReducedMotion();
  const [tab, setTab] = useState("sizes");
  const footwear = product.category === "shoes";
  const gender = product.gender || "unisex";
  const chart = footwear
    ? `https://www.nike.com/size-fit/${gender === "women" ? "womens-footwear" : gender === "kids" ? "kids-footwear" : "mens-footwear"}`
    : "https://www.nike.com/size-fit";
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.current?.querySelector('[aria-label="Close size guide"]')?.focus();
    const keydown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
      if (event.key !== "Tab") return;
      const items = [
        ...dialog.current.querySelectorAll(
          'button:not([disabled]), a[href], [tabindex="0"]',
        ),
      ];
      const first = items[0],
        last = items.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      }
      if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener("keydown", keydown);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", keydown);
      returnFocusRef.current?.focus();
    };
  }, [onClose, returnFocusRef]);
  const transition = reducedMotion
    ? { duration: 0 }
    : { type: "spring", stiffness: 330, damping: 34, mass: 0.85 };
  return (
    <motion.div
      className="pdp-sheet-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reducedMotion ? 0 : 0.22 }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <motion.section
        className="pdp-size-sheet"
        ref={dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="size-guide-title"
        initial={{ y: reducedMotion ? 0 : "100%" }}
        animate={{ y: 0 }}
        exit={{ y: reducedMotion ? 0 : "100%" }}
        transition={transition}
        drag="y"
        dragControls={drag}
        dragListener={false}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 0.6 }}
        onDragEnd={(_, info) => {
          if (info.offset.y > 80 || info.velocity.y > 500) onClose();
        }}
      >
        <div
          className="pdp-sheet-grab"
          onPointerDown={(event) => drag.start(event)}
          aria-hidden="true"
        >
          <span />
        </div>
        <header>
          <div>
            <p className="store-eyebrow">A LITTLE HELP WITH THE FIT</p>
            <h2 id="size-guide-title">Size guide</h2>
          </div>
          <button aria-label="Close size guide" onClick={onClose}>
            <XMarkIcon />
          </button>
        </header>
        <p className="pdp-sheet-product">
          {product.name}
          <span>{footwear ? "UK shoe sizes" : "Product sizes"}</span>
        </p>
        <div
          className="pdp-guide-tabs"
          role="group"
          aria-label="Size guide section"
        >
          <button
            aria-pressed={tab === "sizes"}
            onClick={() => setTab("sizes")}
          >
            Available sizes
          </button>
          <button
            aria-pressed={tab === "measure"}
            onClick={() => setTab("measure")}
          >
            How to measure
          </button>
        </div>
        <div className="pdp-guide-content">
          {tab === "sizes" ? (
            <>
              <p>
                Sizes below are for the selected color. Choose a size to use it
                on the product page.
              </p>
              <div className="pdp-guide-sizes">
                {sizes.map(({ size, stock }) => (
                  <button
                    key={size}
                    disabled={stock <= 0}
                    aria-pressed={selectedSize === size}
                    onClick={() => onSelect(size)}
                  >
                    <span>
                      {size}
                      {selectedSize === size && <CheckIcon />}
                    </span>
                    <small>{stock > 0 ? "Available" : "Out of stock"}</small>
                  </button>
                ))}
              </div>
              <div className="pdp-fit-note">
                <strong>Find your best fit.</strong>
                <p>
                  {footwear
                    ? "Measure both feet and use the longer measurement when comparing with Nike’s size chart. The CM label on a shoe box is different from measured foot length."
                    : "Measure your body rather than your clothes. Compare your measurements with the chart for the specific garment and fit."}
                </p>
              </div>
            </>
          ) : (
            <div className="pdp-measure-guide">
              <h3>
                {footwear
                  ? "Start from the ground up."
                  : "A fit that feels like you."}
              </h3>
              <ol>
                {(footwear
                  ? [
                      "Wear the socks you plan to wear with the shoes and stand on a sheet of paper.",
                      "Mark the back of your heel and the tip of your longest toe. Measure the straight distance between the marks.",
                      "Repeat for your other foot. Use the longer measurement with the official chart; check fit notes for this model.",
                    ]
                  : [
                      "Use a soft tape measure and stand naturally without pulling the tape tight.",
                      "Measure around the fullest part of your chest, your natural waist, and the fullest part of your hips.",
                      "Compare with the chart for your garment. Check the product description for a slim, standard or oversized fit.",
                    ]
                ).map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </div>
          )}
          <a
            className="pdp-chart-link"
            href={chart}
            target="_blank"
            rel="noopener noreferrer"
          >
            View Nike’s full size chart <ArrowUpRightIcon />
          </a>
        </div>
        <footer>
          <p>
            {selectedSize
              ? `Selected: ${selectedSize}`
              : "Take a moment. Find your fit."}
          </p>
          <button className="store-button" onClick={onClose}>
            {selectedSize ? "Use this size" : "Done"}
            <CheckIcon />
          </button>
        </footer>
      </motion.section>
    </motion.div>
  );
}

export default function SizeGuide({ open, ...props }) {
  return createPortal(
    <AnimatePresence>
      {open && <GuideDialog key="size-guide" {...props} />}
    </AnimatePresence>,
    document.body,
  );
}
