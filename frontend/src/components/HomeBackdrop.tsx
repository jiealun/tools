export default function HomeBackdrop() {
  return (
    <div className="home-backdrop" aria-hidden="true">
      <svg viewBox="0 0 1440 1000" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="backdrop-sky" x1="360" y1="880" x2="1530" y2="490" gradientUnits="userSpaceOnUse">
            <stop stopColor="#72E3F2" stopOpacity=".5" />
            <stop offset=".48" stopColor="#48B6FF" stopOpacity=".72" />
            <stop offset="1" stopColor="#1670EE" stopOpacity=".56" />
          </linearGradient>
          <linearGradient id="backdrop-loop" x1="930" y1="30" x2="1510" y2="390" gradientUnits="userSpaceOnUse">
            <stop stopColor="#E6FAFF" stopOpacity=".76" />
            <stop offset=".45" stopColor="#82D8FF" stopOpacity=".58" />
            <stop offset="1" stopColor="#368BFA" stopOpacity=".42" />
          </linearGradient>
          <radialGradient id="backdrop-glow" cx="0" cy="0" r="1" gradientTransform="translate(1050 470) rotate(90) scale(470 720)" gradientUnits="userSpaceOnUse">
            <stop stopColor="#B8F5FF" stopOpacity=".54" />
            <stop offset="1" stopColor="#70BCFF" stopOpacity="0" />
          </radialGradient>
          <pattern id="backdrop-dots" width="15" height="15" patternUnits="userSpaceOnUse" patternTransform="rotate(-8)">
            <circle cx="2" cy="2" r="1.35" fill="white" fillOpacity=".58" />
          </pattern>
        </defs>

        <rect width="1440" height="1000" fill="url(#backdrop-glow)" />

        <g className="home-backdrop__loop">
          <path
            d="M1000 -70C921 92 1005 304 1190 316C1345 326 1403 211 1530 80"
            fill="none"
            stroke="url(#backdrop-loop)"
            strokeWidth="118"
            strokeLinecap="round"
          />
          <path d="M1000 -70C921 92 1005 304 1190 316C1345 326 1403 211 1530 80" fill="none" stroke="white" strokeOpacity=".46" strokeWidth="2.5" />
        </g>

        <g className="home-backdrop__ring">
          <ellipse cx="1240" cy="310" rx="350" ry="164" transform="rotate(-18 1240 310)" fill="none" stroke="#EAF9FF" strokeOpacity=".5" strokeWidth="3" />
          <ellipse cx="1240" cy="310" rx="306" ry="136" transform="rotate(-18 1240 310)" fill="none" stroke="#6DCBFF" strokeOpacity=".14" strokeWidth="44" />
        </g>

        <g className="home-backdrop__ribbon">
          <path
            d="M250 1110C548 815 725 600 960 616C1196 632 1336 819 1574 502"
            fill="none"
            stroke="url(#backdrop-sky)"
            strokeWidth="210"
            strokeLinecap="round"
          />
          <path
            className="home-backdrop__mesh"
            d="M250 1110C548 815 725 600 960 616C1196 632 1336 819 1574 502"
            fill="none"
            stroke="url(#backdrop-dots)"
            strokeWidth="184"
            strokeLinecap="round"
          />
          <path d="M250 1110C548 815 725 600 960 616C1196 632 1336 819 1574 502" fill="none" stroke="white" strokeOpacity=".5" strokeWidth="2.5" />
        </g>

        <g className="home-backdrop__orb">
          <rect x="1300" y="585" width="72" height="72" rx="22" transform="rotate(-16 1300 585)" fill="#2D88F7" fillOpacity=".42" />
          <rect x="1311" y="596" width="50" height="50" rx="15" transform="rotate(-16 1311 596)" fill="#C5F0FF" fillOpacity=".42" stroke="white" strokeOpacity=".52" />
        </g>
      </svg>
    </div>
  )
}
