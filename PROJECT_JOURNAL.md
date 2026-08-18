## Timing Metric Change: Reaction Time to Timing Error

### Previous approach
The prototype measured reaction time from when a target note appeared
to when the player pressed the corresponding piano key.

### Problem
This metric is appropriate for a note-recognition task but not for rhythm
gameplay. In the rhythm version, the player is expected to wait until a
falling note reaches the hit line rather than respond immediately.

### New approach
The system will measure timing error by comparing the player's input time
with the scheduled hit time of the falling note.

Timing error = player input time - scheduled hit time

Negative values indicate an early input, while positive values indicate
a late input.

### Purpose
This provides a more meaningful measure of rhythm performance and allows
the game to classify inputs using timing windows such as Perfect, Good
and Miss.

### Evaluation value
Timing error can later be analysed using average timing error, early/late
bias, hit accuracy and judgement distributions.