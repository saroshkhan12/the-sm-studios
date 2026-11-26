import "./style.css";
import { mountExperience } from "./experience-engine.js";

// The standalone Vite harness and the Next.js route share the same scene engine.
mountExperience(document.body);
