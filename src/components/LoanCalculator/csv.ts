import { PaymentRow } from './loanMath'

export function scheduleToCSV(rows: PaymentRow[]){
  const header = ['Period','Payment','Interest','Principal','Balance']
  const lines = [header.join(',')]
  for(const r of rows){
    lines.push([r.period, r.payment.toFixed(2), r.interest.toFixed(2), r.principal.toFixed(2), r.balance.toFixed(2)].join(','))
  }
  return lines.join('\n')
}

export function downloadCSV(filename:string, csv:string){
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
