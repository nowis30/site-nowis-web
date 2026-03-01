export type Frequency = 'monthly' | 'biweekly' | 'weekly' | 'biweekly-acc' | 'weekly-acc'

export interface LoanInput {
  principal: number
  annualRatePercent: number
  years: number
  months?: number // additional months 0-11
  frequency: Frequency
  extraPayment?: number
  annualLumpSum?: number
  annualLumpMonth?: number // 1-12
}

export interface PaymentRow {
  period: number
  payment: number
  interest: number
  principal: number
  balance: number
}

function periodsPerYear(freq: Frequency){
  switch(freq){
    case 'monthly': return 12
    case 'biweekly': return 26
    case 'weekly': return 52
    case 'biweekly-acc': return 26
    case 'weekly-acc': return 52
  }
}

export function computePayment(input: LoanInput){
  const { principal: L, annualRatePercent, years = 0, months = 0, frequency } = input
  const totalYears = years + (months || 0) / 12
  const annualRate = annualRatePercent / 100
  if(frequency === 'biweekly-acc' || frequency === 'weekly-acc'){
    const rMonthly = annualRate / 12
    const nMonthly = totalYears * 12
    let Pm = 0
    if(rMonthly > 0) Pm = L * (rMonthly) / (1 - Math.pow(1 + rMonthly, -nMonthly))
    else Pm = L / nMonthly
    return frequency === 'biweekly-acc' ? Pm / 2 : Pm / 4
  }

  const ppy = periodsPerYear(frequency)
  const r = annualRate / ppy
  const n = totalYears * ppy
  if(r > 0){
    return L * r / (1 - Math.pow(1 + r, -n))
  }
  return L / n
}

function approxPeriodsForMonth(month:number, ppy:number){
  return Math.max(1, Math.round((month - 1) / 12 * ppy) + 1)
}

export function buildAmortizationSchedule(input: LoanInput, maxRows = 10000): PaymentRow[]{
  const extra = input.extraPayment ?? 0
  const lump = input.annualLumpSum ?? 0
  const lumpMonth = input.annualLumpMonth ?? 12

  const ppy = periodsPerYear(input.frequency)
  const annualRate = input.annualRatePercent / 100
  const rPeriod = annualRate / ppy
  const totalYears = input.years + (input.months ?? 0) / 12
  const basePayment = computePayment(input)
  const rows: PaymentRow[] = []

  let balance = input.principal
  let period = 0
  const maxPeriods = Math.ceil(totalYears * ppy)

  const lumpPeriodInYear = approxPeriodsForMonth(lumpMonth, ppy)

  while(balance > 0 && period < maxRows){
    period++
    const interest = balance * rPeriod
    let payment = basePayment + extra

    if(lump > 0){
      const periodInYear = ((period - 1) % ppy) + 1
      if(periodInYear === lumpPeriodInYear){
        payment += lump
      }
    }

    let principal = payment - interest
    if(principal > balance){
      principal = balance
      payment = interest + principal
    }

    balance = Math.max(0, +(balance - principal))

    rows.push({
      period,
      payment: +payment,
      interest: +interest,
      principal: +principal,
      balance: +balance
    })

    if(period > maxPeriods + 5) break
  }

  return rows
}

export function summarizeLoan(input: LoanInput){
  const schedule = buildAmortizationSchedule(input)
  const totalPayments = schedule.length
  const totalPaid = schedule.reduce((s,r)=>s+r.payment,0)
  const totalInterest = schedule.reduce((s,r)=>s+r.interest,0)
  const periodsYear = periodsPerYear(input.frequency)
  const months = Math.round((totalPayments / periodsYear) * 12)
  const years = Math.floor(months / 12)
  const remMonths = months % 12

  return {
    payment: computePayment(input) + (input.extraPayment ?? 0),
    totalInterest,
    totalPaid,
    totalPayments,
    estYears: years,
    estMonths: remMonths,
    schedule
  }
}
