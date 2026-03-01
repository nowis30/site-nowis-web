"use client"

import React from 'react'
import { LoanInput, Frequency } from './loanMath'
import './loanCalculator.css'

export default function LoanForm({value, onChange, onCalculate, onSave}:{
  value: LoanInput,
  onChange:(v:LoanInput)=>void,
  onCalculate:()=>void,
  onSave:(slot:number)=>void
}){
  const freqs: {[k:string]:Frequency} = {
    'Mensuel':'monthly',
    'Aux 2 semaines':'biweekly',
    'Hebdo':'weekly',
    'Aux 2 semaines (accéléré)':'biweekly-acc',
    'Hebdo (accéléré)':'weekly-acc'
  }

  const set = (patch:Partial<LoanInput>)=> onChange({...value, ...patch})

  return (
    <div className="lc-card">
      <h3>Entrée du prêt</h3>
      <div className="lc-field">
        <label>Montant du prêt</label>
        <input type="number" value={value.principal} onChange={e=>set({principal: +e.target.value})} />
      </div>
      <div className="lc-field">
        <label>Taux annuel (%)</label>
        <input type="number" step="0.01" value={value.annualRatePercent} onChange={e=>set({annualRatePercent: +e.target.value})} />
      </div>
      <div className="lc-field lc-row">
        <div style={{flex:1}}>
          <label>Amortissement (années)</label>
          <input type="number" value={value.years} onChange={e=>set({years: +e.target.value})} />
        </div>
        <div style={{width:120}}>
          <label>Mois additionnels</label>
          <input type="number" min={0} max={11} value={value.months||0} onChange={e=>set({months: +e.target.value})} />
        </div>
      </div>
      <div className="lc-field">
        <label>Fréquence de paiement</label>
        <select value={value.frequency} onChange={e=>set({frequency: e.target.value as Frequency})}>
          {Object.entries(freqs).map(([label,v])=> <option key={v} value={v}>{label}</option>)}
        </select>
      </div>
      <div className="lc-field">
        <label>Paiement additionnel (par période)</label>
        <input type="number" value={value.extraPayment||0} onChange={e=>set({extraPayment: +e.target.value})} />
      </div>
      <div className="lc-field lc-row">
        <div style={{flex:1}}>
          <label>Forfait annuel (lump sum)</label>
          <input type="number" value={value.annualLumpSum||0} onChange={e=>set({annualLumpSum: +e.target.value})} />
        </div>
        <div style={{width:120}}>
          <label>Mois (1-12)</label>
          <input type="number" min={1} max={12} value={value.annualLumpMonth||12} onChange={e=>set({annualLumpMonth: +e.target.value})} />
        </div>
      </div>

      <div style={{display:'flex',gap:8,marginTop:8}}>
        <button onClick={onCalculate}>Calculer</button>
        <button onClick={()=>onSave(0)} style={{background:'#10b981'}}>Sauvegarder A</button>
        <button onClick={()=>onSave(1)} style={{background:'#f59e0b'}}>Sauvegarder B</button>
        <button onClick={()=>onSave(2)} style={{background:'#ef4444'}}>Sauvegarder C</button>
      </div>
    </div>
  )
}
