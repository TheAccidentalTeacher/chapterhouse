"""National standards frameworks and SomerSchool course catalog context."""
from crewai.tools import BaseTool
from pydantic import BaseModel, Field

# National standards as the primary reference; Alaska as supplemental context
CURRICULUM_CONTEXT = """
NATIONAL STANDARDS FRAMEWORKS:

ELA — Common Core State Standards for English Language Arts (CCSS-ELA)
- Grade-specific standards K-12
- Reading: Literature + Informational Text (50/50 by grade 8)
- Writing: Narrative, Informational/Explanatory, Argument
- Speaking & Listening, Language (vocabulary, grammar, conventions)
- Text complexity increases by grade band (K-1, 2-3, 4-5, 6-8, 9-10, 11-12)

Math — Common Core State Standards for Mathematics (CCSS-M)
- Grade-specific standards K-8, then by course (Algebra, Geometry, etc.) in HS
- Standards for Mathematical Practice (8 practices, all grades)
- Domains shift by grade band (Counting & Cardinality → Ratios → Functions)
- Coherence: each grade builds on prior, leads to next

Science — Next Generation Science Standards (NGSS)
- Organized by grade bands: K-2, 3-5, MS (6-8), HS (9-12)
- Three dimensions: Disciplinary Core Ideas (DCI), Science & Engineering Practices (SEP),
  Crosscutting Concepts (CCC)
- Performance Expectations (PEs) define what students should be able to do
- Life Science, Physical Science, Earth & Space Science, Engineering

Social Studies — College, Career, and Civic Life (C3) Framework
- Dimension-based, not strictly grade-locked
- Dimension 1: Developing Questions and Planning Inquiries
- Dimension 2: Applying Disciplinary Concepts (Civics, Economics, Geography, History)
- Dimension 3: Evaluating Sources and Using Evidence
- Dimension 4: Communicating Conclusions and Taking Informed Action
- Supports inquiry-based design at all grade levels

ALASKA SUPPLEMENTAL CONTEXT:
- Alaska adopted standards align with CCSS (ELA/Math) and NGSS (Science) with state additions
- Local/traditional ecological knowledge (TEK) integrated in science
- Alaska Studies required at grade 4; Alaska Native history emphasis
- Oral tradition and Alaska Native storytelling count as legitimate text structures

SOMERSCHOOL CURRICULAR CONSTRAINTS:
- ALL content must be secular — Alaska Statute 14.03.320 (nonsectarian requirement)
- No religious references, no prayer, no faith-based framing
- Curriculum must be self-directed learner friendly (home use by a single parent)
- Cultural references to Alaska Native spirituality treated as cultural/historical only

SOMERSCHOOL COURSE CATALOG (current targets):
- ELA grades 1-12, Math grades 1-12, Science grades 1-12, Social Studies grades 1-12
- "Newsies: The American Story" — Anna Somers, literary elective
- "Les Misérables: Revolution and Justice" — Anna Somers, literary elective
- "Balancing Your Checkbook" + "Taxes 101" — free lead-gen courses
"""


class CurriculumContextInput(BaseModel):
    topic: str = Field(description="Specific topic or subject to get context for")


class CurriculumContextTool(BaseTool):
    name: str = "curriculum_context"
    description: str = (
        "Retrieve national standards frameworks (CCSS-ELA, CCSS-M, NGSS, C3), "
        "SomerSchool constraints, and supplemental Alaska context. Always call this "
        "when drafting or reviewing curriculum to ensure standards alignment."
    )
    args_schema: type[BaseModel] = CurriculumContextInput

    def _run(self, topic: str) -> str:
        return f"Context requested for: {topic}\n\n{CURRICULUM_CONTEXT}"
