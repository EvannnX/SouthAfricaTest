export const formatCurrencyZAR = (value: number | undefined | null) => {
  const amount = Number(value || 0)
  // 南非兰特，常用符号 R
  return `R ${amount.toFixed(2)}`
}

export const formatNumber = (value: number | undefined | null, digits: number = 2) => {
  const n = Number(value || 0)
  return n.toFixed(digits)
} 