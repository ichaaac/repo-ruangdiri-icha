const MonthChip = ({ label }) => {
  return (
    <div
      style={{
        backgroundColor: "#ECEEF0",
        borderRadius: 45,
        padding: "8px 20px",
        height: 44,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#0F172B",
        fontSize: 20,
        fontWeight: 400,
        lineHeight: "140%",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </div>
  )
}

export default MonthChip
