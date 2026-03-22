export function SkeletonLine({ width = "100%", height = 14, radius = 6, T, style = {} }) {
  return (
    <div style={{
      width, height, borderRadius: radius,
      background: `linear-gradient(90deg, ${T.skeleton} 25%, ${T.skeletonShine} 50%, ${T.skeleton} 75%)`,
      backgroundSize: "200% 100%",
      animation: "shimmer 1.4s ease-in-out infinite",
      ...style,
    }}/>
  );
}
export function SkeletonCard({ T, index = 0 }) {
  return (
    <div style={{
      background: T.surface,
      border: `1px solid ${T.border}`,
      borderLeft: `3px solid ${T.border}`,
      borderRadius: 12,
      padding: "12px 14px",
      display: "flex",
      alignItems: "center",
      gap: 12,
      animationDelay: `${index * 40}ms`,
    }} className="fade">
      <div style={{flexShrink:0,minWidth:48,display:"flex",flexDirection:"column",gap:5,alignItems:"center"}}>
        <SkeletonLine width={36} height={13} T={T}/>
        <SkeletonLine width={28} height={10} T={T}/>
      </div>
      <div style={{width:1,height:28,background:T.border,flexShrink:0}}/>
      <div style={{flex:1,display:"flex",flexDirection:"column",gap:5}}>
        <SkeletonLine width="85%" height={13} T={T}/>
        <SkeletonLine width="55%" height={11} T={T}/>
      </div>
    </div>
  );
}
export function SkeletonWeekCard({ T, index = 0 }) {
  return (
    <div style={{
      background: T.surface,
      border: `1px solid ${T.border}`,
      borderLeft: `3px solid ${T.border}`,
      borderRadius: 12,
      overflow: "hidden",
      animationDelay: `${index * 35}ms`,
    }} className="fade">
      <div style={{padding:"9px 13px",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:`1px solid ${T.border}`}}>
        <SkeletonLine width={60} height={12} T={T}/>
        <SkeletonLine width={70} height={12} T={T}/>
      </div>
      <div style={{padding:"8px 13px 10px",display:"flex",flexDirection:"column",gap:5}}>
        <SkeletonLine width="70%" height={11} T={T}/>
        <SkeletonLine width="50%" height={11} T={T}/>
      </div>
    </div>
  );
}
