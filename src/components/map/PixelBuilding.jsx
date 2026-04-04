export function PixelBuilding({ accent, type }) {
  // Helper: R(x,y,w,h,fill) — compact rect
  const R = (x,y,w,h,f) => <rect x={x} y={y} width={w} height={h} fill={f}/>;

  if (type === "pabellones") {
    // 2-story green hospital, cross on roof, double doors, awning, plants
    return (
      <svg viewBox="0 0 80 64" width="96" height="77" style={{imageRendering:"pixelated",display:"block"}}>
        {/* Ground shadow */}
        {R(6,58,68,6,"#00000015")}
        {/* Main wall */}
        {R(8,16,64,42,"#1A3D2A")} {R(10,16,60,42,"#1E4D30")}
        {/* Wall texture — brick lines */}
        {R(10,24,60,1,"#16382590")} {R(10,32,60,1,"#16382590")} {R(10,40,60,1,"#16382590")} {R(10,48,60,1,"#16382590")}
        {/* Roof */}
        {R(6,14,68,4,"#2D6B3F")} {R(4,12,72,3,"#13C045")} {R(4,11,72,2,"#0FA038")}
        {/* Cross on roof */}
        {R(36,2,8,10,"#FFFFFF")} {R(33,5,14,4,"#FFFFFF")} {R(37,3,6,8,"#13C045")} {R(34,6,12,2,"#13C045")}
        {/* Floor separator */}
        {R(10,34,60,2,"#2D6B3F50")}
        {/* Windows — top floor */}
        {R(14,18,10,7,"#0A1C12")} {R(15,19,8,5,"#80FFB040")} {R(15,19,8,1,"#80FFB020")}
        {R(28,18,10,7,"#0A1C12")} {R(29,19,8,5,"#80FFB040")} {R(29,19,8,1,"#80FFB020")}
        {R(42,18,10,7,"#0A1C12")} {R(43,19,8,5,"#80FFB040")} {R(43,19,8,1,"#80FFB020")}
        {R(56,18,10,7,"#0A1C12")} {R(57,19,8,5,"#80FFB040")} {R(57,19,8,1,"#80FFB020")}
        {/* Operating light in top-left window */}
        {R(17,20,4,2,"#FFEE80")} {R(18,22,2,1,"#FFD700")}
        {/* Windows — bottom floor */}
        {R(14,37,10,7,"#0A1C12")} {R(15,38,8,5,"#80FFB030")}
        {R(56,37,10,7,"#0A1C12")} {R(57,38,8,5,"#80FFB030")}
        {/* Double door */}
        {R(30,42,20,16,"#0D2818")} {R(31,43,8,15,"#1A5030")} {R(41,43,8,15,"#1E5A36")}
        {R(38,49,4,4,"#FFD700")} {/* door handle */}
        {/* Awning over door */}
        {R(26,40,28,3,"#13C045")} {R(27,40,2,3,"#FFFFFF60")} {R(31,40,2,3,"#FFFFFF60")} {R(35,40,2,3,"#FFFFFF60")}
        {R(39,40,2,3,"#FFFFFF60")} {R(43,40,2,3,"#FFFFFF60")} {R(47,40,2,3,"#FFFFFF60")} {R(51,40,2,3,"#FFFFFF60")}
        {/* Plants */}
        {R(10,52,4,6,"#5D4037")} {R(8,48,8,5,"#2E7D32")} {R(9,46,6,3,"#388E3C")}
        {R(66,52,4,6,"#5D4037")} {R(64,48,8,5,"#2E7D32")} {R(65,46,6,3,"#388E3C")}
        {/* Steps */}
        {R(28,56,24,2,"#2D6B3F80")} {R(26,57,28,2,"#2D6B3F50")}
      </svg>
    );
  }

  if (type === "jofre") {
    // Amber/gold building, scope detail, sign "JOFRÉ", seminar room hint
    return (
      <svg viewBox="0 0 80 64" width="96" height="77" style={{imageRendering:"pixelated",display:"block"}}>
        {R(6,58,68,6,"#00000015")}
        {/* Main wall */}
        {R(8,22,64,36,"#4A3520")} {R(10,22,60,36,"#5C4429")}
        {/* Wall texture */}
        {R(10,30,60,1,"#4A352080")} {R(10,38,60,1,"#4A352080")} {R(10,46,60,1,"#4A352080")}
        {/* Roof */}
        {R(6,20,68,4,"#6B4F30")} {R(4,18,72,3,"#FBBF24")} {R(4,17,72,2,"#E5A91F")}
        {/* Sign on roof — "JOFRÉ" */}
        {R(22,8,36,10,"#3D2B15")} {R(23,9,34,8,"#5C4429")}
        <text x="40" y="15.5" textAnchor="middle" fontSize="6" fontWeight="900" fill="#FBBF24" fontFamily="monospace">JOFRÉ</text>
        {/* Scope decoration on sign */}
        {R(18,9,4,6,"#FBBF24")} {R(17,8,6,2,"#FBBF24")} {R(19,14,2,4,"#FBBF24AA")}
        {/* Big windows — seminar room (left) */}
        {R(13,25,18,14,"#0D0800")} {R(14,26,16,12,"#FBBF2420")}
        {/* Chairs visible inside */}
        {R(16,34,3,2,"#FBBF2440")} {R(21,34,3,2,"#FBBF2440")} {R(26,34,3,2,"#FBBF2440")}
        {/* Big window — arthro room (right) */}
        {R(49,25,18,14,"#0D0800")} {R(50,26,16,12,"#FBBF2420")}
        {/* Arthroscope detail inside */}
        {R(56,28,2,8,"#FBBF2450")} {R(54,28,6,2,"#FBBF2460")} {R(57,35,3,2,"#88FF8840")}
        {/* Door */}
        {R(34,38,12,20,"#0D0800")} {R(35,39,10,19,"#3D2B15")} {R(43,48,2,3,"#FFD700")}
        {/* Awning — striped */}
        {R(30,36,20,3,"#FBBF24")} {R(31,36,2,3,"#FFFFFF50")} {R(35,36,2,3,"#FFFFFF50")}
        {R(39,36,2,3,"#FFFFFF50")} {R(43,36,2,3,"#FFFFFF50")} {R(47,36,2,3,"#FFFFFF50")}
        {/* Side lamp */}
        {R(10,38,2,12,"#6B4F30")} {R(9,36,4,3,"#FBBF2480")}
        {/* Barrel */}
        {R(68,48,6,10,"#6B4F30")} {R(68,50,6,1,"#5C4429")} {R(68,54,6,1,"#5C4429")} {R(69,47,4,2,"#7B5F38")}
        {/* Small plant */}
        {R(64,52,4,6,"#5D4037")} {R(62,49,8,4,"#F9A825")} {R(63,47,6,3,"#FDD835")}
      </svg>
    );
  }

  if (type === "policlinicos") {
    // Blue, long building, many windows, reception-style door
    return (
      <svg viewBox="0 0 80 64" width="96" height="77" style={{imageRendering:"pixelated",display:"block"}}>
        {R(6,58,68,6,"#00000015")}
        {/* Main wall */}
        {R(4,24,72,34,"#0F2A4A")} {R(6,24,68,34,"#153660")}
        {/* Wall texture */}
        {R(6,32,68,1,"#0F2A4A80")} {R(6,40,68,1,"#0F2A4A80")} {R(6,48,68,1,"#0F2A4A80")}
        {/* Roof */}
        {R(2,22,76,4,"#1A4C80")} {R(0,20,80,3,"#348FFF")} {R(0,19,80,2,"#2B7AE0")}
        {/* Sign */}
        {R(14,10,52,10,"#0F2A4A")} {R(15,11,50,8,"#153660")}
        <text x="40" y="17.5" textAnchor="middle" fontSize="5.5" fontWeight="900" fill="#348FFF" fontFamily="monospace">POLICLÍNICO</text>
        {/* Stethoscope on sign */}
        {R(8,11,5,2,"#348FFF")} {R(7,13,3,4,"#348FFF")} {R(11,13,3,4,"#348FFF")} {R(8,16,5,2,"#348FFFAA")}
        {/* Many windows — row 1 */}
        {R(8,27,8,6,"#061220")} {R(9,28,6,4,"#348FFF20")} {R(9,28,6,1,"#348FFF15")}
        {R(20,27,8,6,"#061220")} {R(21,28,6,4,"#348FFF20")}
        {R(32,27,8,6,"#061220")} {R(33,28,6,4,"#348FFF20")}
        {R(44,27,8,6,"#061220")} {R(45,28,6,4,"#348FFF20")}
        {R(56,27,8,6,"#061220")} {R(57,28,6,4,"#348FFF20")}
        {R(68,27,6,6,"#061220")} {R(69,28,4,4,"#348FFF20")}
        {/* Windows — row 2 */}
        {R(8,41,8,6,"#061220")} {R(9,42,6,4,"#348FFF15")}
        {R(56,41,8,6,"#061220")} {R(57,42,6,4,"#348FFF15")}
        {R(68,41,6,6,"#061220")} {R(69,42,4,4,"#348FFF15")}
        {/* Reception door — glass */}
        {R(26,40,28,18,"#061220")} {R(27,41,12,17,"#348FFF12")} {R(41,41,12,17,"#348FFF12")}
        {R(39,48,2,6,"#FFD700")} {/* handle */}
        {/* Awning */}
        {R(22,38,36,3,"#348FFF")} {R(23,38,2,3,"#FFFFFF40")} {R(27,38,2,3,"#FFFFFF40")} {R(31,38,2,3,"#FFFFFF40")}
        {R(35,38,2,3,"#FFFFFF40")} {R(39,38,2,3,"#FFFFFF40")} {R(43,38,2,3,"#FFFFFF40")}
        {R(47,38,2,3,"#FFFFFF40")} {R(51,38,2,3,"#FFFFFF40")} {R(55,38,2,3,"#FFFFFF40")}
        {/* Bench outside */}
        {R(6,54,12,2,"#1A4C80")} {R(6,52,2,3,"#1A4C80")} {R(16,52,2,3,"#1A4C80")}
        {/* Small plant */}
        {R(70,52,4,6,"#5D4037")} {R(68,49,8,4,"#1B5E20")} {R(69,47,6,3,"#2E7D32")}
      </svg>
    );
  }

  if (type === "urgencia") {
    // Red emergency building, big red cross, wide entrance, ambulance bay hint
    return (
      <svg viewBox="0 0 80 64" width="96" height="77" style={{imageRendering:"pixelated",display:"block"}}>
        {R(6,58,68,6,"#00000015")}
        {/* Main wall */}
        {R(8,18,64,40,"#4A1010")} {R(10,18,60,40,"#5C1515")}
        {/* Wall texture */}
        {R(10,26,60,1,"#4A101080")} {R(10,34,60,1,"#4A101080")} {R(10,42,60,1,"#4A101080")}
        {/* Roof */}
        {R(6,16,68,4,"#7A2020")} {R(4,14,72,3,"#F87171")} {R(4,13,72,2,"#E05555")}
        {/* Red cross on roof — bigger */}
        {R(34,2,12,12,"#FFFFFF")} {R(31,5,18,6,"#FFFFFF")} {R(35,3,10,10,"#F87171")} {R(32,6,16,4,"#F87171")}
        {/* Emergency light */}
        {R(22,3,4,4,"#FF0000")} {R(23,2,2,2,"#FF4444")}
        {R(54,3,4,4,"#3344FF")} {R(55,2,2,2,"#5566FF")}
        {/* Windows — top row */}
        {R(14,21,10,7,"#200505")} {R(15,22,8,5,"#F8717118")} {R(15,22,8,1,"#F8717110")}
        {R(28,21,10,7,"#200505")} {R(29,22,8,5,"#F8717118")}
        {R(42,21,10,7,"#200505")} {R(43,22,8,5,"#F8717118")}
        {R(56,21,10,7,"#200505")} {R(57,22,8,5,"#F8717118")}
        {/* Windows — bottom row */}
        {R(14,36,10,7,"#200505")} {R(15,37,8,5,"#F8717115")}
        {R(56,36,10,7,"#200505")} {R(57,37,8,5,"#F8717115")}
        {/* Wide ambulance entrance */}
        {R(26,34,28,24,"#200505")} {R(27,35,26,23,"#5C151510")}
        {/* Red/white striped awning */}
        {R(22,32,36,3,"#F87171")} {R(23,32,3,3,"#FFFFFF70")} {R(29,32,3,3,"#FFFFFF70")} {R(35,32,3,3,"#FFFFFF70")}
        {R(41,32,3,3,"#FFFFFF70")} {R(47,32,3,3,"#FFFFFF70")} {R(53,32,3,3,"#FFFFFF70")}
        {/* URGENCIA sign above door */}
        {R(28,29,24,4,"#CC0000")}
        <text x="40" y="32" textAnchor="middle" fontSize="3.5" fontWeight="900" fill="#FFFFFF" fontFamily="monospace">URGENCIA</text>
        {/* Ambulance stripes on ground */}
        {R(30,56,8,2,"#F8717140")} {R(42,56,8,2,"#F8717140")}
        {/* Cone */}
        {R(10,52,4,6,"#FF6600")} {R(10,52,4,2,"#FFFFFF80")} {R(11,50,2,3,"#FF6600")}
      </svg>
    );
  }

  return null;
}
