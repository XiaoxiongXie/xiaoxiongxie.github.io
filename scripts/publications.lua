-- Insert build-generated HTML after the pre-render hook, including on a fresh clone.
function Div(div)
  local name = nil
  if div.classes:includes("generated-publications") then name = "publications" end
  if div.classes:includes("generated-profile-links") then name = "profile-links" end
  if div.classes:includes("generated-paper") then
    local id = div.attributes["paper-id"] or ""
    assert(id:match("^[a-z0-9-]+$"), "Use a verified publication ID for a research paper.")
    name = "paper-" .. id
  end
  if div.classes:includes("generated-portrait") then name = "portrait" end
  if div.classes:includes("generated-analytics-privacy") then name = "analytics-privacy" end
  if not name then return nil end
  local path = quarto.project.directory .. "/_generated/" .. name .. ".html"
  local file = assert(io.open(path, "r"), "Run a project-level quarto render to generate publications.")
  local content = file:read("*a")
  file:close()
  return pandoc.RawBlock("html", content)
end
