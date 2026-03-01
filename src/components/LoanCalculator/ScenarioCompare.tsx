"use client"

import React from 'react'
import { LoanInput, summarizeLoan } from './loanMath'
import './loanCalculator.css'

export default function ScenarioCompare({scenarios}:{scenarios:(LoanInput|null)[]}){
  return (
    <div className="lc-card">
      <h3>Comparateur</h3>
      <div className="lc-scenarios">
        {scenarios.map((s,idx)=> (
          <div className="lc-scenario-card" key={idx}>
            <div className="lc-small">Scénario {String.fromCharCode(65+idx)}</div>
            {s ? (()=>{
              const r = summarizeLoan(s)
              return (
                <div>
                  <div className="lc-small">Paiement: <strong>{r.payment.toFixed(2)}</strong></div>
                  <div className="lc-small">Intérêts totaux: <strong>{r.totalInterest.toFixed(2)}</strong></div>
                  <div className="lc-small">Durée: <strong>{r.estYears} ans {r.estMonths} mois</strong></div>
                </div>
              )
            })() : <div className="lc-muted">Vide</div>}
          </div>
        ))}
      </div>
    </div>
  )
}
