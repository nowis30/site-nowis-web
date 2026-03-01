import React, {useState} from 'react'
import { PaymentRow } from './loanMath'
import './loanCalculator.css'

export default function AmortizationTable({rows}:{rows:PaymentRow[]}){
  const [page,setPage] = useState(0)
  const per = 50
  const pages = Math.max(1, Math.ceil(rows.length / per))
  const start = page * per
  const slice = rows.slice(start, start + per)

  return (
    <div className="lc-card">
      <h3>Tableau d'amortissement</h3>
      <table className="lc-table">
        <thead>
          <tr><th>#</th><th>Payment</th><th>Interest</th><th>Principal</th><th>Balance</th></tr>
        </thead>
        <tbody>
          {slice.map(r=> (
            <tr key={r.period}>
              <td style={{textAlign:'left'}}>{r.period}</td>
              <td>{r.payment.toFixed(2)}</td>
              <td>{r.interest.toFixed(2)}</td>
              <td>{r.principal.toFixed(2)}</td>
              <td>{r.balance.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="lc-pager">
        <button onClick={()=>setPage(p=>Math.max(0,p-1))} disabled={page===0}>Prev</button>
        <div className="lc-muted">Page {page+1} / {pages}</div>
        <button onClick={()=>setPage(p=>Math.min(p+1,pages-1))} disabled={page>=pages-1}>Next</button>
      </div>
    </div>
  )
}
