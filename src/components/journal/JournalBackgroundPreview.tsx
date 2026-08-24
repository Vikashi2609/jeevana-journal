import { useState } from "react";
import "./journal-background-preview.css";

const palettes = {
  terracotta: {
    name: "Terracotta",
    paper: "#F7F0E6",
    primary: "#B85C45",
    secondary: "#D9A441",
    accent: "#6F8064",
    dark: "#30352F",
    soft: "#E8C9B8",
  },

  botanical: {
    name: "Botanical",
    paper: "#F2F1E8",
    primary: "#526B57",
    secondary: "#A7B58E",
    accent: "#C88B62",
    dark: "#29352C",
    soft: "#DCE2D1",
  },

  ocean: {
    name: "Ocean",
    paper: "#EEF3F2",
    primary: "#245A68",
    secondary: "#5E9AA3",
    accent: "#D8A65A",
    dark: "#24373D",
    soft: "#C8DFDF",
  },

  coral: {
    name: "Coral",
    paper: "#FFF2EC",
    primary: "#D65F59",
    secondary: "#F0A35B",
    accent: "#5D7094",
    dark: "#35333A",
    soft: "#F4CEC3",
  },

  violet: {
    name: "Violet",
    paper: "#F5F0F7",
    primary: "#76568C",
    secondary: "#C69AB8",
    accent: "#D89B5B",
    dark: "#39323D",
    soft: "#E5D7E8",
  },
};

export default function JournalBackgroundPreview() {
  const [active, setActive] = useState("terracotta");

  const colors = palettes[active];

  return (
    <div className="preview-app">
      <div className="palette-bar">
        <div className="palette-title">
          <span>JEEVANA JOURNAL</span>
          <small>BACKGROUND SYSTEM</small>
        </div>

        <div className="palette-buttons">
          {Object.entries(palettes).map(([key, palette]) => (
            <button
              key={key}
              onClick={() => setActive(key)}
              className={active === key ? "active" : ""}
            >
              <span
                className="swatch"
                style={{ background: palette.primary }}
              />
              {palette.name}
            </button>
          ))}
        </div>
      </div>

      <div className="page-stage">
        <div
          className="journal-page"
          style={{
            "--paper": colors.paper,
            "--primary": colors.primary,
            "--secondary": colors.secondary,
            "--accent": colors.accent,
            "--dark": colors.dark,
            "--soft": colors.soft,
          }}
        >
          <div className="grain" />

          <div className="shape shape-one" />
          <div className="shape shape-two" />
          <div className="shape shape-three" />

          <div className="top-line">
            <span>JEEVANA JOURNAL</span>
            <span>VOL. 01 / 2026</span>
          </div>

          <div className="hero-block">
            <div className="hero-label">
              SCHOOL • COMMUNITY • LIFE
            </div>

            <h1>
              Stories
              <br />
              That Matter
            </h1>

            <p>
              A collection of ideas, people, moments and
              memories from the Jeevana community.
            </p>
          </div>

          <div className="image-placeholder">
            <span>PHOTOGRAPH</span>
          </div>

          <div className="bottom-block">
            <div>
              <span className="small-label">FEATURE</span>
              <h2>Our Year in Focus</h2>
            </div>

            <div className="number">01</div>
          </div>

          <div className="vertical-text">
            JEEVANA • 2026
          </div>
        </div>
      </div>
    </div>
  );
}