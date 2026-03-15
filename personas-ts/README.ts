// Auto-generated from README.md
export const README = `# AI Personas System

The personas system allows you to customize the AI's personality, communication style, and expertise to match your needs.

## What are Personas?

Personas are personality profiles that define how the AI assistant communicates and behaves. Each persona has:

- **Communication Style** - How formal or casual, verbose or concise
- **Expertise** - Specific knowledge domains or skills
- **Personality** - Characteristics that make interactions feel consistent
- **Guidelines** - Rules for how to respond in different situations

## Built-in Personas

### Default (\`default.md\`)
A friendly, conversational assistant that matches your tone. Great for general work and coding.

### Fellowship (\`fellowship.md\`)
A team of characters from The Lord of the Rings (Dungeon Master, Gandalf, Samwise, Aragorn, etc.) who each contribute their unique perspectives. Loads the full \`FELLOWSHIP_GUIDE.md\` for deep character context.

## Creating New Personas

### Quick Start

1. **Copy the template:**
   \`\`\`bash
   cp personas/_TEMPLATE.md personas/my-persona.md
   \`\`\`

2. **Edit the file** with your persona details

3. **Add to the dropdown** in \`index.html\`:
   \`\`\`html
   <option value="my-persona">My Persona Name</option>
   \`\`\`

4. **Restart the server** - Done!

### That's It!

The system automatically:
- Loads your \`.md\` file from \`personas/\` folder
- Uses it as the AI's system prompt
- Maintains the personality across conversations
- Appends current editor state for context

## Persona Guidelines

### Communication Style Tips
- Be specific about tone (formal, casual, enthusiastic, etc.)
- Define how they handle different message lengths
- Specify when to be verbose vs. concise
- Describe their personality traits

### Expertise Areas
- List specific domains they excel in
- Mention any special knowledge or frameworks
- Note what they're NOT expert in (optional)

### Example Interactions
- Include short greeting responses
- Show how they handle complex questions
- Demonstrate their problem-solving approach
- Examples help the AI understand the persona

## Advanced: Multi-Character Personas

Like the Fellowship mode, you can create personas with multiple characters:

1. Define each character in the persona file
2. Give them distinct personalities and roles
3. Specify how they interact (debate, agree, build on each other)
4. Include a "narrator" or "moderator" character

See \`fellowship.md\` and \`FELLOWSHIP_GUIDE.md\` for a full example.

## Tips for Best Results

- **Be specific** - Vague descriptions lead to inconsistent behavior
- **Include examples** - Show, don't just tell
- **Test and iterate** - Try the persona and refine based on results
- **Keep it focused** - Too many instructions can dilute the personality
- **Have fun** - Personas make the AI more engaging and memorable

## Technical Details

Persona files are loaded server-side and prepended to the system prompt. The current editor state is appended after the persona content, giving the AI both personality and context.

Maximum persona file size: ~50KB (to leave room for conversation history and editor state)

## Examples to Try

**The Socratic Teacher**
- Asks questions instead of giving answers
- Helps you discover solutions yourself
- Patient and encouraging

**The Speedrunner**
- Obsessed with optimization and efficiency
- Suggests keyboard shortcuts and faster workflows
- Celebrates performance improvements

**The Artist**
- Focuses on aesthetics and visual design
- Uses rich, descriptive language
- Sees game design as an art form

**The Scientist**
- Data-driven and analytical
- References research and best practices
- Explains the "why" behind recommendations

Create your own and share with the community!
`;
