const ChartCard = ({ title, chipSlot, children, className = "" }) => {
  return (
    <div
      className={`flex flex-col ${className}`}
      style={{
        background: "#FFFFFF",
        border: "1px solid #DADDE1",
        borderRadius: 12,
        padding: "20px 16px",
      }}
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-5">
        <div>{title}</div>
        {chipSlot && <div className="flex-shrink-0">{chipSlot}</div>}
      </div>
      <div className="flex-1 relative">{children}</div>
    </div>
  )
}

export default ChartCard
