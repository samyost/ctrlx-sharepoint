---
topic: pa-string-ops
description: Power Automate string operations — split-twice {{token}} template engine, chunk() per-character transform, EncodeXmlValue/DecodeXmlName, and expression reference.
sources:
  - .agent/patterns/split-twice-template-engine.md
  - .agent/patterns/chunk-character-replacement.md
  - .agent/skills/power-automate-expressions/SKILL.md
---

# PA String Operations

---

## Split-Twice Template Engine

Loop-free `{{token}}` replacement — zero Apply-to-Each, ~0 seconds.

**How it works:** Given `"ABC {{def}} GHI {{jkl}} MN"` and a Dictionary `{"def":"fish","jkl":"chips"}`:

1. **Split on `{{`** → `["ABC ", "def}} GHI ", "jkl}} MN"]`
2. **Select — split each item on `}}`** → `[["ABC "], ["def"," GHI "], ["jkl"," MN"]]`
3. **Select — conditional lookup:**
   ```
   if(equals(length(item()), 2),
     concat(outputs('Dictionary')?[item()?[0]], item()?[1]),
     item()?[0])
   ```
   2 elements → token key, look up in dictionary + append suffix. 1 element → literal, pass through.
4. **Join on `''`** → `"ABC fish GHI chips MN"`

**Case-insensitive tokens:** `outputs('Dictionary')?[toLower(item()?[0])]`

**Use cases:** Email templates, Smart Gateway HTML, merge-field replacement, activity log entry templating (`"{{Actor}} assigned {{Task}} to {{Assignee}}"`).

| Approach | Loops | Speed | Notes |
|---|---|---|---|
| Split-Twice | None | ~0 sec | Best for dynamic token sets |
| Apply-to-Each + Replace | O(N) | 5–30 sec | Easiest to build |
| Nested `replace()` | None | ~0 sec | Brittle — hard-coded per token |

---

## Chunk Character Replacement

Loop-free per-character transformation using `chunk()` + `Select` + `coalesce()`.

**Core insight:** `string → array → map → join`. Select is a map() function.

```text
Step 1: chunk(outputs('Compose'), 1)          // each char = one array element
Step 2: Select
  from:  chunk(outputs('Compose'), 1)
  map:   coalesce(
           if(equals(item(), '&'), '&amp;', null),
           if(equals(item(), '<'), '&lt;', null),
           if(equals(item(), '>'), '&gt;', null),
           if(equals(item(), '"'), '&quot;', null),
           if(equals(item(), ''''), '&#39;', null),
           item(), null
         )
Step 3: join(body('Select'), '')
```

`coalesce()` returns the first non-null — first matching `if()` wins, otherwise pass through.

**Why not nested `replace()`:** Order matters (`&` → `&amp;` → `&amp;amp;` double-encode), and each additional character requires another wrapping layer.

---

## XML Encode/Decode Functions (Undocumented)

Four undocumented Power Automate expressions discovered by Eliot Cole:

| Function | Purpose |
|---|---|
| `EncodeXmlValue(str)` | Escapes `<`, `>`, `&`, `"`, `'` — shortcut for HTML escaping |
| `EncodeXmlName(str)` | Encode string for use as XML element name |
| `DecodeXmlValue(str)` | Decode XML-encoded value |
| `DecodeXmlName(str)` | Decode XML-encoded element name back to original |

**`EncodeXmlValue()` shortcut** — may replace the entire `chunk()` pattern for HTML escaping:
```text
EncodeXmlValue(outputs('Compose'))
```

**`DecodeXmlName()` for JSON key iteration** — extract all keys from any JSON object without knowing property names:
1. Wrap in root: `addProperty(json('{}'), 'root', json(yourJsonString))`
2. XPath all children: `xpath(xml(...), '/root/*')`
3. In Select: `DecodeXmlName(xpath(item(), 'name(/*)'))`  → key name; `xpath(item(), 'string(/*)')` → value

**`@`-prefix keys → XML attributes:** Keys starting with `@` in JSON become XML attributes when converted via `xml()`.

---

## Expression Reference

### String Functions

| Expression | Purpose |
|---|---|
| `split(string, delimiter)` | Split to array |
| `substring(string, start, length)` | Extract by position+length |
| `slice(string, start, end)` | Extract by start+end positions |
| `concat(s1, s2, ...)` | Join strings |
| `join(array, separator)` | Array → string |
| `replace(s, find, with)` | Single replacement |
| `toLower(string)` | Lowercase |
| `toUpper(string)` | Uppercase |
| `trim(string)` | Strip leading/trailing whitespace |
| `startsWith(s1, s2)` | Prefix check (case-insensitive) |
| `endsWith(s1, s2)` | Suffix check (case-insensitive) |
| `indexOf(s1, s2)` | First position of s2 in s1 (-1 if not found) |
| `lastIndexOf(s1, s2)` | Last position |
| `contains(s1, s2)` | Case-sensitive contains check |
| `length(string\|array)` | Character count or array length |
| `empty(string\|array)` | Is it empty? |

### Date Functions

| Expression | Purpose |
|---|---|
| `utcNow(format)` | Current UTC datetime |
| `addDays(date, n)` | Add N days |
| `subtractFromTime(date, n, 'Day')` | Subtract N days |
| `formatDateTime(date, format)` | Format as string (e.g. `'yyyy-MM-dd'`) |
| `convertTimeZone(date, from, to)` | Timezone conversion |
| `convertFromUtc(date, tz)` | UTC → local |
| `parseDateTime(date, locale, fmt)` | Any format → ISO |
| `ticks(date)` | 100-nanosecond ticks from 0001-01-01 |
| `startOfDay(date)` | Midnight of date |
| `dayOfWeek(date)` | 0=Sunday |

### Array Functions

| Expression | Purpose |
|---|---|
| `first(array)` | First item |
| `last(array)` | Last item |
| `skip(array, n)` | Drop first N |
| `take(array, n)` | Keep first N |
| `sort(array, property)` | Sort ascending |
| `reverse(array)` | Reverse order |
| `intersection(a1, a2)` | Items in both |
| `union(a1, a2)` | All items, deduplicated |
| `contains(array, value)` | Value exists check |
| `range(from, to)` | Integer array |
| `chunk(array, size)` | Split into chunks of N |

### Logical

| Expression | Purpose |
|---|---|
| `if(cond, true, false)` | Ternary |
| `coalesce(v1, v2, ...)` | First non-null/empty |
| `and(c1, c2)` | All true |
| `or(c1, c2)` | Any true |
| `not(cond)` | Negate |
| `equals(v1, v2)` | Equality |
| `greater(v1, v2)` | v1 > v2 |
| `less(v1, v2)` | v1 < v2 |

### Data Conversion

| Expression | Purpose |
|---|---|
| `string(input)` | To string |
| `int(input)` | To integer |
| `float(input)` | To decimal |
| `json(input)` | To JSON |
| `xml(input)` | To XML |
| `guid()` | New GUID |
| `addProperty(json, key, val)` | Add JSON property |
| `setProperty(json, key, val)` | Update JSON property |
| `removeProperty(json, key)` | Remove JSON property |
