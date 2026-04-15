import { Link } from "react-router-dom"

export default function Breadcrumb({ items = [] }) {
  return (
    <nav className="flex items-center text-sm mb-6" style={{ gap: 8 }}>
      {items.map((item, i) => {
        const isLast = i === items.length - 1
        return (
          <span key={i} className="flex items-center" style={{ gap: 8 }}>
            {i > 0 && <span className="text-[#F59E0B] text-xs">&#9654;</span>}
            {isLast ? (
              <span className="text-[#1F2937] font-semibold">{item.label}</span>
            ) : item.to ? (
              <Link to={item.to} className="text-[#9CA3AF] hover:text-[#6B7280] transition-colors cursor-pointer">{item.label}</Link>
            ) : (
              <span className="text-[#9CA3AF]">{item.label}</span>
            )}
          </span>
        )
      })}
    </nav>
  )
}
