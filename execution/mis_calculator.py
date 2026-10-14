"""
Atlas Diagnostics Data & Financial Engine
Execution script for seeding initial data, calculating referral commissions, and computing P&L.
"""

import json
import os
from datetime import datetime

def calculate_pnl(revenue_items, expense_items, payroll_items):
    total_gross_revenue = sum(item.get('amount', 0) for item in revenue_items if item.get('status') == 'PAID')
    total_discounts = sum(item.get('discount', 0) for item in revenue_items)
    net_revenue = total_gross_revenue - total_discounts
    
    total_expenses = sum(item.get('amount', 0) for item in expense_items)
    total_payroll = sum(item.get('net_salary', 0) for item in payroll_items)
    total_outflow = total_expenses + total_payroll
    
    net_profit = net_revenue - total_outflow
    margin_pct = (net_profit / net_revenue * 100) if net_revenue > 0 else 0
    
    return {
        "gross_revenue": total_gross_revenue,
        "discounts": total_discounts,
        "net_revenue": net_revenue,
        "operational_expenses": total_expenses,
        "payroll_expenses": total_payroll,
        "total_outflow": total_outflow,
        "net_profit": net_profit,
        "margin_percentage": round(margin_pct, 2)
    }

def calculate_referral_leaderboard(bills, referrers):
    referrer_stats = {}
    for r in referrers:
        referrer_stats[r['id']] = {
            "id": r['id'],
            "name": r['name'],
            "specialty": r.get('specialty', 'General'),
            "hospital": r.get('hospital', 'Independent Clinic'),
            "commission_pct": r.get('commission_pct', 15),
            "status": r.get('status', 'APPROVED'),
            "patient_count": 0,
            "total_revenue": 0,
            "total_commission": 0
        }
        
    for b in bills:
        ref_id = b.get('referring_doctor_id')
        if ref_id and ref_id in referrer_stats:
            amt = b.get('total_amount', 0)
            referrer_stats[ref_id]['patient_count'] += 1
            referrer_stats[ref_id]['total_revenue'] += amt
            comm_pct = referrer_stats[ref_id]['commission_pct']
            referrer_stats[ref_id]['total_commission'] += round(amt * (comm_pct / 100), 2)
            
    leaderboard = list(referrer_stats.values())
    leaderboard.sort(key=lambda x: x['total_revenue'], reverse=True)
    return leaderboard

if __name__ == "__main__":
    print("Atlas Diagnostics Execution Engine initialized.")
