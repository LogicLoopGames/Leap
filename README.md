# Leap - The Number Placement Game

A minimalist strategic puzzle game where you try to place consecutive numbers on a 7x7 grid by making valid moves.

![image](https://github.com/user-attachments/assets/beb5d92e-0523-4138-bafb-836d3bb6b889)

![image](https://github.com/user-attachments/assets/1a4e6ebe-121d-4b1b-acfa-3e10733c6982)

## How to Play

1. **Starting the Game**
   - Click any cell on the 7x7 grid to place the number 1
   - Your goal is to place as many consecutive numbers as possible

2. **Movement Rules**
   - **Straight Moves**: You can move horizontally or vertically by skipping 2 cells
   - **Diagonal Moves**: You can move diagonally by skipping 1 cell
   - Valid moves are highlighted with a blue border

3. **Power-Ups and Power-Downs**
   - **Range Modifiers**
     - Green cells (+1): Increases movement range by 1 for one move
     - Red cells (-1): Decreases movement range by 1 for one move
   - **Score Multipliers**
     - Gold cells (2×): Doubles your points
     - Pink cells (3×): Triples your points
     - Multipliers stack multiplicatively (e.g., 2× + 2× = 4×, 4× + 3× = 12×)
     - Each new multiplier resets the 5-second duration
   - **Special Movement**
     - Purple cells (T): Teleport to any empty cell once
   - All power-ups appear randomly and last for 10 seconds if not used
   - Power-ups disappear after use or when time runs out

4. **Game End**
   - The game ends when there are no valid moves left
   - However, if you can reach a teleport or range modifier that enables new moves, the game continues
   - Your score is the highest number you placed
   - Try to beat your high score!

5. **Line Clearing**
   - When a row or column is completely filled, it gets cleared
   - Clearing lines awards bonus points (100 × number of lines × current multiplier)
   - Cleared lines make room for new moves
   - New power-ups appear after line clears
   - Multiple lines can be cleared at once

## Features

- 7x7 grid gameplay
- Dynamic power-up system with timing mechanics
- Multiple types of power-ups for varied strategy
- Multiplicative score multipliers
- Visual indicators for power-up durations
- Smart game-over detection considering power-ups
- Teleportation ability
- High score tracking
- Valid move highlighting
- Responsive design
- Line clearing system with bonus points
- Visual clear animations
- Strategic line-filling gameplay

## Tips

- Plan your moves carefully to avoid getting stuck
- Use power-ups strategically to reach otherwise inaccessible cells
- Sometimes a power-down can help you access tight spots
- Try to chain score multipliers for exponential scores
- Watch the power-up timers to avoid losing valuable bonuses
- Save teleport for emergency situations
- Look ahead for power-ups that might prevent game over
- Try to keep multiple paths open for longer gameplay
- Try to fill rows and columns for bonus points
- Use multipliers before clearing lines for higher bonuses
- Plan your moves to set up multiple line clears

## Power-Up Strategy Guide

1. **Range Modifiers (+1/-1)**
   - Use +1 to reach distant valuable cells
   - Use -1 to access tight spots between numbers
   - Can save you from game over by enabling new moves

2. **Score Multipliers (2×/3×)**
   - Active for 5 seconds after collection
   - Stack multiplicatively with other multipliers
   - Each new multiplier refreshes the duration
   - Can achieve high multipliers (e.g., 2× → 4× → 12×)
   - Try to make multiple moves while multipliers are active

3. **Teleport (T)**
   - One-time use per pickup
   - Great for escaping trapped positions
   - Can help reach isolated power-ups
   - Might prevent game over by providing new options
