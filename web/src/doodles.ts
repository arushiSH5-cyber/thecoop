/* Icons, Coo and sample scenes, carried over as-is from the prototype. */
export const face=(x:number,y:number,k=1)=>`<circle class="ik" cx="${x-5*k}" cy="${y}" r="${1.8*k}"/><circle class="ik" cx="${x+5*k}" cy="${y}" r="${1.8*k}"/><ellipse class="ibl" cx="${x-9*k}" cy="${y+3.2*k}" rx="${2.7*k}" ry="${1.6*k}"/><ellipse class="ibl" cx="${x+9*k}" cy="${y+3.2*k}" rx="${2.7*k}" ry="${1.6*k}"/><path d="M${x-2.4*k} ${y+2.6*k}q${1.2*k} ${1.6*k} ${2.4*k} 0q${1.2*k} ${1.6*k} ${2.4*k} 0" style="stroke-width:1.6"/>`;
export const D: Record<string,string>={
 lobby:`<path class="c" d="M8 24 24 9l16 15v17H8z"/><path class="k1" d="M20 41v-9a4 4 0 0 1 8 0v9z"/>`+face(24,22,.6),
 feed:`<rect class="b1" x="10" y="9" width="22" height="32" rx="5" transform="rotate(-9 21 25)"/><rect class="c" x="15" y="8" width="22" height="32" rx="5"/><path d="M20 17h12M20 23h12M20 29h7"/>`,
 news:`<path class="c" d="M8 10h26v28a4 4 0 0 1-4 4H12a4 4 0 0 1-4-4z"/><path d="M34 18h6v20a4 4 0 0 1-4 4"/><rect class="k1" x="13" y="15" width="16" height="9" rx="2"/><path d="M13 30h16M13 35h10"/>`,
 learn:`<path class="c" d="M24 14c-5-4-11-4-17-2v25c6-2 12-2 17 2 5-4 11-4 17-2V12c-6-2-12-2-17 2z"/><path d="M24 14v25"/><path d="M11 19c3-1 6-1 9 0M11 25c3-1 6-1 9 0M28 19c3-1 6-1 9 0" style="stroke-width:1.5"/>`,
 help:`<path class="p1" d="M24 41S8 31 8 19a8 8 0 0 1 16-3 8 8 0 0 1 16 3c0 12-16 22-16 22z"/><path d="M24 20v9M19.5 24.5h9" style="stroke-width:2.6"/>`,
 circles:`<circle class="b1" cx="16" cy="20" r="8"/><circle class="k1" cx="32" cy="20" r="8"/><circle class="p1" cx="24" cy="32" r="8"/>`,
 mic:`<rect class="c" x="17" y="6" width="14" height="24" rx="7"/><path d="M11 22a13 13 0 0 0 26 0M24 35v7M17 42h14"/>`,
 stop:`<rect class="k1" x="12" y="12" width="24" height="24" rx="6"/>`,
 keys:`<rect class="c" x="5" y="13" width="38" height="24" rx="5"/><path d="M11 20h2M17 20h2M23 20h2M29 20h2M35 20h2M11 26h2M35 26h2M16 31h16"/>`,
 info:`<circle class="b1" cx="24" cy="24" r="17"/><path d="M24 22v11M24 15.5v.5" style="stroke-width:3"/>`,
 gear:`<circle class="c" cx="24" cy="24" r="6"/><path d="M24 5v6M24 37v6M5 24h6M37 24h6M10.6 10.6l4.2 4.2M33.2 33.2l4.2 4.2M10.6 37.4l4.2-4.2M33.2 14.8l4.2-4.2"/>`,
 heart:`<path class="k1" d="M24 40S8 30 8 19a8 8 0 0 1 16-3 8 8 0 0 1 16 3c0 11-16 21-16 21z"/>`,
 star:`<path class="k1" d="M24 5l5 11.5 12.5 1.5-9.3 8.4 2.6 12.4L24 32.5l-10.8 6.3 2.6-12.4L6.5 18 19 16.5z"/>`,
 shield:`<path class="p1" d="M24 5 9 11v11c0 10 7 17 15 21 8-4 15-11 15-21V11z"/><path d="M17 24l5 5 9-10" style="stroke-width:2.6"/>`,
 bus:`<rect class="b1" x="8" y="8" width="32" height="28" rx="6"/><path d="M8 24h32M14 36v5M34 36v5"/><circle class="ik" cx="15" cy="30" r="2"/><circle class="ik" cx="33" cy="30" r="2"/>`,
 book:`<path class="k1" d="M10 8h24a4 4 0 0 1 4 4v28H14a4 4 0 0 1-4-4z"/><path d="M10 36a4 4 0 0 1 4-4h24"/><path d="M18 16h12M18 21h9" style="stroke-width:1.6"/>`,
 brief:`<rect class="p1" x="7" y="15" width="34" height="24" rx="4"/><path d="M18 15v-4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v4M7 25h34"/>`,
 video:`<rect class="b1" x="6" y="12" width="28" height="24" rx="5"/><path class="k1" d="M34 20l9-5v18l-9-5z"/>`,
 bot:`<path d="M24 14V9"/><circle class="k1" cx="24" cy="7" r="3"/><rect class="c" x="11" y="14" width="26" height="23" rx="8"/>`+face(24,25,.9)
};
export const svg=(n:string)=>`<svg class="ic" viewBox="0 0 48 48" aria-hidden="true">${D[n]}</svg>`;
export const INK="#262c4a";
export const coo=(cls="")=>`<svg class="coo ${cls}" viewBox="0 0 80 80" aria-hidden="true"><g stroke="${INK}" stroke-linecap="round" stroke-linejoin="round">
<path d="M33 69v5M47 69v5M30 74h6M44 74h6" stroke="#ff9a6a" stroke-width="2.4" fill="none"/>
<path d="M13 50c0-17 12-30 27-30s27 13 27 30c0 13-11 21-27 21S13 63 13 50z" fill="#fffdf9" stroke-width="2.6"/>
<path d="M17 51q6-9 14-4q-3 10-14 4z" fill="#c6f1d8" stroke-width="2"/>
<path d="M63 51q-6-9-13-4q3 9 13 4z" fill="#c6f1d8" stroke-width="2"/>
<path d="M14 38c0-5 4-8 7-8M66 38c0-5-4-8-7-8" stroke-width="2.4" fill="none"/>
<rect x="9" y="36" width="9" height="13" rx="4" fill="#7fa6f4" stroke-width="2"/><rect x="62" y="36" width="9" height="13" rx="4" fill="#7fa6f4" stroke-width="2"/>
<path d="M21 31q19-18 38 0" stroke-width="3" fill="none"/>
<g class="eyes"><g class="blink"><circle cx="31" cy="44" r="2.7" fill="${INK}" stroke="none"/><circle cx="49" cy="44" r="2.7" fill="${INK}" stroke="none"/><circle cx="32" cy="43" r=".9" fill="#fff" stroke="none"/><circle cx="50" cy="43" r=".9" fill="#fff" stroke="none"/></g></g>
<path d="M37.5 48h5l-2.5 3.2z" fill="#ffb27a" stroke-width="1.6"/>
<ellipse cx="25" cy="50" rx="4.2" ry="2.5" fill="#ffa58a" stroke="none" opacity=".6"/><ellipse cx="55" cy="50" rx="4.2" ry="2.5" fill="#ffa58a" stroke="none" opacity=".6"/></g></svg>`;
export const SCENES: Record<string,string>={
 beach:`<svg viewBox="0 0 320 180" aria-hidden="true"><rect width="320" height="180" fill="#ffd6bd"/><rect y="0" width="320" height="95" fill="#ffc29b"/><circle cx="250" cy="70" r="28" fill="#ffe29a" stroke="${INK}" stroke-width="2.5"/><path d="M0 100c40-12 80 12 120 0s80-12 120 0 60 8 80 2v78H0z" fill="#9cc7ff" stroke="${INK}" stroke-width="2.5"/><path d="M0 130c40-10 80 10 120 0s80-10 120 0 60 6 80 0" fill="none" stroke="#fff" stroke-width="3"/><path d="M0 160h320v20H0z" fill="#f6e3b8"/><g transform="translate(118 72)"><rect x="-6" y="-2" width="16" height="90" rx="8" fill="#ff8a5c" stroke="${INK}" stroke-width="2.5" transform="rotate(-18)"/><circle cx="30" cy="10" r="11" fill="#c08a64" stroke="${INK}" stroke-width="2.5"/><path d="M19 4c4-9 18-9 22 0" fill="#3a2a22" stroke="${INK}" stroke-width="2"/><path d="M22 22h16l4 30H18z" fill="#4a82ee" stroke="${INK}" stroke-width="2.5"/><path d="M22 28 8 40M38 28l12 10M22 52l-4 24M38 52l4 24" stroke="${INK}" stroke-width="2.5" stroke-linecap="round"/><path d="M26 13q4 4 8 0" fill="none" stroke="${INK}" stroke-width="2" stroke-linecap="round"/></g></svg>`,
 garden:`<svg viewBox="0 0 320 180" aria-hidden="true"><rect width="320" height="180" fill="#d2e2ff"/><rect y="120" width="320" height="60" fill="#b78a62"/><g stroke="${INK}" stroke-width="2.5" stroke-linecap="round"><path d="M60 125V50M140 125V40M220 125V55" fill="none"/><path d="M60 80c-20-8-28-24-24-30 12 0 22 10 24 30zM140 70c22-8 30-24 26-30-12 0-24 10-26 30zM220 85c-20-8-26-22-22-28 12 0 20 10 22 28z" fill="#9fdcb2"/><circle cx="70" cy="95" r="12" fill="#ff6a4d"/><circle cx="50" cy="108" r="10" fill="#ff6a4d"/><circle cx="150" cy="90" r="13" fill="#ff6a4d"/><circle cx="130" cy="104" r="11" fill="#ffb347"/><circle cx="230" cy="100" r="12" fill="#ff6a4d"/></g><g transform="translate(262 92)" stroke="${INK}" stroke-width="2.5"><circle cx="0" cy="0" r="11" fill="#e9c4a0"/><path d="M-13-6q13-14 26 0" fill="#fff"/><path d="M-9 12h18l3 34h-24z" fill="#9fdcb2"/><path d="M-4 3q4 3 8 0" fill="none" stroke-linecap="round"/></g></svg>`
};
