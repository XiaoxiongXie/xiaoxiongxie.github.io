-- Insert build-generated HTML after the pre-render hook, including on a fresh clone.
function Div(div)
  local name = nil
  if div.classes:includes("generated-publications") then name = "publications" end
  if div.classes:includes("generated-featured") then name = "featured" end
  if not name then return nil end
  local path = quarto.project.directory .. "/_generated/" .. name .. ".html"
  local file = assert(io.open(path, "r"), "Run a project-level quarto render to generate publications.")
  local content = file:read("*a")
  file:close()
  return pandoc.RawBlock("html", content)
end
