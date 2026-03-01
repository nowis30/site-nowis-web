"use client"

import React, {useState} from 'react'
import LoanForm from './LoanForm'
import ResultsSummary from './ResultsSummary'
import AmortizationTable from './AmortizationTable'
import ScenarioCompare from './ScenarioCompare'
import { LoanInput, buildAmortizationSchedule } from './loanMath'
import { scheduleToCSV, downloadCSV } from './csv'
import './loanCalculator.css'

const defaultInput: LoanInput = {
  principal: 250000,
  annualRatePercent: 5.25,
  years: 25,
  months: 0,
  frequency: 'monthly',
  extraPayment: 0,
  annualLumpSum: 0,
  annualLumpMonth: 12
}

export default function Calculator(){
  const [input,setInput] = useState<LoanInput>(defaultInput)
  const [schedule,setSchedule] = useState(() => buildAmortizationSchedule(defaultInput))
  const [scenarios,setScenarios] = useState<(LoanInput|null)[]>([null,null,null])

  const calculate = ()=>{
    const s = buildAmortizationSchedule(input, 10000)
    setSchedule(s)
  }

  const saveScenario = (slot:number)=>{
    const copy = [...scenarios]
    copy[slot] = {...input}
    setScenarios(copy)
  }

  return (
    <div className="lc-container">
      <div className="lc-grid">
        <div>
          <LoanForm value={input} onChange={setInput} onCalculate={calculate} onSave={saveScenario} />
          <ResultsSummary input={input} />
          <div style={{height:12}} />
          <button style={{marginBottom:8}} onClick={()=>{ const csv = scheduleToCSV(schedule); downloadCSV('amortization.csv', csv)}}>Télécharger CSV</button>
          <AmortizationTable rows={schedule} />
        </div>
        <div>
          <ScenarioCompare scenarios={scenarios} />
        </div>
      </div>
    </div>
  )
}
