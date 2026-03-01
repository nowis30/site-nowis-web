"use client"

import React from 'react'
import { summarizeLoan, LoanInput } from './loanMath'
import './loanCalculator.css'

export default function ResultsSummary({input}:{input:LoanInput}){
  const s = summarizeLoan(input)

  return (
    <div className="lc-card">
      <h3>Résultats</h3>
      <div className="lc-small">Paiement périodique: <strong>{s.payment.toFixed(2)}</strong></div>
      <div className="lc-small">Total intérêts: <strong>{s.totalInterest.toFixed(2)}</strong></div>
      <div className="lc-small">Total payé: <strong>{s.totalPaid.toFixed(2)}</strong></div>
      <div className="lc-small">Nombre de paiements: <strong>{s.totalPayments}</strong></div>
      <div className="lc-small">Durée estimée: <strong>{s.estYears} ans {s.estMonths} mois</strong></div>
    </div>
  )
}
