import type { ReactNode } from "react";

export function ProblemSolutionSection({ problemTitle, problem, solutionTitle, solution, visual }: {
  problemTitle: string; problem: string; solutionTitle: string; solution: string; visual?: ReactNode;
}) {
  return <section className="lp-section"><div className="lp-container"><div className="lp-grid-3" style={{alignItems:"stretch"}}>
    <article className="lp-card"><p className="lp-eyebrow">THE CHALLENGE</p><h2 className="lp-h4">{problemTitle}</h2><p className="lp-body-2" style={{color:"var(--lp-muted)"}}>{problem}</p></article>
    <article className="lp-card"><p className="lp-eyebrow">THE APPROACH</p><h2 className="lp-h4">{solutionTitle}</h2><p className="lp-body-2" style={{color:"var(--lp-muted)"}}>{solution}</p></article>
    {visual && <div>{visual}</div>}
  </div></div></section>;
}
