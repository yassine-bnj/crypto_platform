"use client"

export const getThemeColors = (isDark: boolean) => {
  if (isDark) {
    return {
      gridStroke: "rgba(255, 255, 255, 0.1)",
      axisStroke: "rgba(255, 255, 255, 0.5)",
      tooltipBg: "rgba(18, 18, 35, 0.95)",
      tooltipBorder: "rgba(255, 165, 0, 0.3)",
      tooltipText: "rgba(255, 255, 255, 0.9)",
      lineStroke: "#FFA500",
      dashedLineStroke: "rgba(255, 255, 255, 0.4)",
    }
  }
  return {
    gridStroke: "rgba(0, 0, 0, 0.1)",
    axisStroke: "rgba(0, 0, 0, 0.4)",
    tooltipBg: "rgba(255, 255, 255, 0.95)",
    tooltipBorder: "rgba(255, 165, 0, 0.3)",
    tooltipText: "rgba(0, 0, 0, 0.9)",
    lineStroke: "#FFA500",
    dashedLineStroke: "rgba(0, 0, 0, 0.3)",
  }
}
