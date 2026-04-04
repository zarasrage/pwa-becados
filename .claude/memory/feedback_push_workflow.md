---
name: Push workflow preference
description: User wants to control when git push happens — only push when explicitly asked
type: feedback
---

No hacer git push automáticamente después de commits. Solo hacer cambios locales y commits cuando corresponda, pero esperar que el usuario diga explícitamente "haz el push" antes de pushear.

**Why:** El usuario quiere controlar el momento del push.
**How to apply:** Hacer git add + commit si es necesario, pero NUNCA git push sin que el usuario lo pida.
