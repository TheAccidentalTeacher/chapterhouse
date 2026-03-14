"""Alaska Grade Level Expectations and SomerSchool course catalog context."""
from crewai.tools import BaseTool
from pydantic import BaseModel, Field

# Inline context — no external dep needed for this core domain knowledge
ALASKA_CONTEXT = """
ALASKA EDUCATIONAL CONTEXT — Scott Somers, Glennallen Middle School

STUDENT DEMOGRAPHICS:
- 65% Alaska Native students (Ahtna Athabascan, primarily)
- Title 1 school — high poverty designation
- Rural, pop. 439, Copper River Basin
- -50°F winters. Subsistence culture (hunting, fishing, gathering) is real and current.
- Many students have IEPs. Reading levels vary widely within same grade.

ALASKA GRADE LEVEL EXPECTATIONS (GLE) — KEY STANDARDS:
ELA:
- Focus on informational text alongside literary text (50/50 by 8th grade)
- Alaska Writing Project aligns with CCSS ELA adapted for AK
- Oral tradition and Alaska Native storytelling count as legitimate text structures

Math:
- Alaska Mathematics Standards align with CCSS-M with state additions
- Real-world application required — Alaska examples (subsistence math, land measurement)

Science:
- Alaska Science Standards align with NGSS
- Local/traditional ecological knowledge (TEK) is explicitly integrated
- Land-based science units (biology of local species, earth science of permafrost) are encouraged

Social Studies:
- Alaska Studies required at grade 4 and optional middle school elective
- History emphasis: Alaska Native history, ANCSA (1971), Alaska Statehood (1959)
- Geography: Alaska size comparisons, biomes, indigenous place names

SOMERSCHOOL CURRICULAR CONSTRAINTS:
- ALL content must be secular — Alaska Statute 14.03.320 prohibits sectarian instruction
  in state-funded education. This includes homeschool allotment purchases.
- No religious references, no prayer, no faith-based framing in any SomerSchool course
- Cultural references to Alaska Native spirituality are treated as cultural/historical content
  only (not devotional or instructional from a faith perspective)
- Curriculum must be appropriate for home use by a single parent — self-directed learner friendly

SOMERSCHOOL COURSE CATALOG (current):
- ELA grades 1-12 (in development)
- Math grades 1-12 (targeting Algebra 1 by grade 8)
- Science grades 1-12 (NGSS-aligned)
- Social Studies grades 1-12 (Alaska & world emphasis)
- "Newsies: The American Story" — Anna Somers, literary elective
- "Les Misérables: Revolution and Justice" — Anna Somers, literary elective
- "Balancing Your Checkbook" — free lead-gen, teen/adult
- "Taxes 101" — free lead-gen, teen/adult
"""


class CurriculumContextInput(BaseModel):
    topic: str = Field(description="Specific topic or subject to get context for")


class CurriculumContextTool(BaseTool):
    name: str = "curriculum_context"
    description: str = (
        "Retrieve Alaska Grade Level Expectations, SomerSchool constraints, and "
        "classroom context for Scott's Glennallen school. Always call this when "
        "drafting or reviewing curriculum to ensure Alaska-specific relevance."
    )
    args_schema: type[BaseModel] = CurriculumContextInput

    def _run(self, topic: str) -> str:
        return f"Context requested for: {topic}\n\n{ALASKA_CONTEXT}"
