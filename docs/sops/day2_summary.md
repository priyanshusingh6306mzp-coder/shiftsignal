# ShiftSignal — Day 2 Summary

## Dataset
- Synthetic production records: 1080
- Machines: 6
- Ground-truth anomalies: 27
- Training period: First 15 days
- Test period: Remaining 45 days
- Test records: 810

## Features Engineered
- Achievement percentage
- Defect rate percentage
- Downtime percentage
- Yield percentage
- Output deviation percentage

## Detection Approaches

### Robust Z-score
- Precision: 0.774
- Recall: 0.889
- F1-score: 0.828
- True positives: 24
- False positives: 7
- False negatives: 3

### Isolation Forest
- Precision: 0.333
- Recall: 0.556
- F1-score: 0.417
- True positives: 15
- False positives: 30
- False negatives: 12

## Decision
Robust Z-score selected as the primary
anomaly detection method.

Isolation Forest retained as an experimental
machine learning comparison.

## Limitations
- All production data is synthetic.
- Training period is assumed anomaly-free.
- Results do not establish real-world factory performance.
- Further testing is required on unseen datasets.

## Next Steps
- Create anomaly records.
- Implement SQLite issue tracking.
- Build issue lifecycle management.
- Carry unresolved issues across shifts.