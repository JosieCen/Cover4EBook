"use client";

import clsx from "clsx";
import { startTransition, useEffect, useMemo, useRef, useState } from "react";

import {
  artDirectionPresets,
  fontOptions,
  getFontStack,
  layoutPresets,
} from "@/lib/art-direction";
import { renderCoverBlob } from "@/lib/export-cover";
import { saveBlobToUserFile } from "@/lib/file-save";
import {
  applyLayoutPreset,
  createProjectDraft,
  listStoredProjects,
  saveProject,
} from "@/lib/project-store";
import type {
  CoverProject,
  CoverVariant,
  LayoutPresetId,
  TextAlign,
  TextLayer,
  TextLayerKey,
} from "@/lib/types";

const ACTIVE_PROJECT_STORAGE_KEY = "cover4ebook_active_project";

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "") || "cover_export";
}

function createUploadedVariant(imageDataUrl: string) {
  return {
    id: crypto.randomUUID(),
    imageDataUrl,
    prompt: "User uploaded background",
    revisedPrompt: "upload fallback",
    createdAt: new Date().toISOString(),
    sourceType: "upload" as const,
  };
}

function PreviewStage({
  project,
  selectedVariant,
  selectedLayerKey,
  onSelectLayer,
  onMoveLayer,
  onResizeLayer,
}: {
  project: CoverProject;
  selectedVariant: CoverVariant | null;
  selectedLayerKey: TextLayerKey;
  onSelectLayer: (key: TextLayerKey) => void;
  onMoveLayer: (key: TextLayerKey, x: number, y: number) => void;
  onResizeLayer: (key: TextLayerKey, width: number, fontSize: number) => void;
}) {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const [dragState, setDragState] = useState<{
    mode: "move" | "resize";
    key: TextLayerKey;
    pointerId: number;
    originX: number;
    originY: number;
    originWidth: number;
    originFontSize: number;
    startClientX: number;
    startClientY: number;
    stageWidth: number;
    stageHeight: number;
  } | null>(null);

  useEffect(() => {
    if (!dragState) {
      return;
    }

    const currentDrag = dragState;

    function handlePointerMove(event: PointerEvent) {
      if (event.pointerId !== currentDrag.pointerId) {
        return;
      }

      const layer = project.textLayers[currentDrag.key];
      const deltaX = (event.clientX - currentDrag.startClientX) / currentDrag.stageWidth;
      const deltaY = (event.clientY - currentDrag.startClientY) / currentDrag.stageHeight;

      if (currentDrag.mode === "move") {
        const nextX = Math.min(Math.max(currentDrag.originX + deltaX, 0), 1 - layer.width);
        const nextY = Math.min(Math.max(currentDrag.originY + deltaY, 0), 0.94);
        onMoveLayer(currentDrag.key, nextX, nextY);
        return;
      }

      const deltaXPx = event.clientX - currentDrag.startClientX;
      const deltaYPx = event.clientY - currentDrag.startClientY;
      const nextWidth = Math.min(Math.max(currentDrag.originWidth + deltaX, 0.18), 1 - currentDrag.originX);
      const fontDelta = deltaXPx * 0.06 + deltaYPx * 0.14;
      const nextFontSize = Math.min(Math.max(currentDrag.originFontSize + fontDelta, 14), 180);
      onResizeLayer(currentDrag.key, nextWidth, nextFontSize);
    }

    function handlePointerUp(event: PointerEvent) {
      if (event.pointerId === currentDrag.pointerId) {
        setDragState(null);
      }
    }

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [dragState, onMoveLayer, onResizeLayer, project.textLayers]);

  return (
    <div className="preview-shell">
      <div className="preview-toolbar">
        <span className="preview-toolbar-label">Canvas</span>
        <span className="preview-toolbar-sep" />
        <span className="preview-toolbar-chip">Drag title and author directly</span>
      </div>
      <div className="preview-stage" ref={stageRef} data-testid="preview-stage">
        <div className="sr-only" data-testid="preview-stage-state">
          {selectedVariant ? "preview-ready" : "preview-empty"}
        </div>
        <div
          className={clsx("preview-art", !selectedVariant && "preview-art-placeholder")}
          style={selectedVariant ? { backgroundImage: `url(${selectedVariant.imageDataUrl})` } : undefined}
        />
        {(["title", "author"] as const).map((key) => {
          const layer = project.textLayers[key];
          const isSelected = selectedLayerKey === key;
          return (
            <button
              key={key}
              type="button"
              data-testid={key === "title" ? "preview-title-layer" : "preview-author-layer"}
              className={clsx("preview-layer", isSelected && "preview-layer-selected")}
              style={{
                left: `${layer.x * 100}%`,
                top: `${layer.y * 100}%`,
                width: `${layer.width * 100}%`,
                color: layer.color,
                fontFamily: getFontStack(layer.fontFamily),
                fontSize: `${layer.fontSize}px`,
                fontWeight: layer.fontWeight,
                letterSpacing: `${layer.letterSpacing}px`,
                lineHeight: layer.lineHeight,
                textAlign: layer.align,
                textTransform: layer.uppercase ? "uppercase" : "none",
              }}
              onClick={() => onSelectLayer(key)}
              onPointerDown={(event) => {
                const stage = stageRef.current;
                if (!stage) {
                  return;
                }
                onSelectLayer(key);
                setDragState({
                  mode: "move",
                  key,
                  pointerId: event.pointerId,
                  originX: layer.x,
                  originY: layer.y,
                  originWidth: layer.width,
                  originFontSize: layer.fontSize,
                  startClientX: event.clientX,
                  startClientY: event.clientY,
                  stageWidth: stage.getBoundingClientRect().width,
                  stageHeight: stage.getBoundingClientRect().height,
                });
              }}
            >
              {layer.text || (key === "title" ? "Your Title" : "Author Name")}
              {isSelected ? (
                <span
                  className="preview-resize-handle"
                  data-testid={key === "title" ? "preview-title-resize" : "preview-author-resize"}
                  onPointerDown={(event) => {
                    event.stopPropagation();
                    const stage = stageRef.current;
                    if (!stage) {
                      return;
                    }
                    setDragState({
                      mode: "resize",
                      key,
                      pointerId: event.pointerId,
                      originX: layer.x,
                      originY: layer.y,
                      originWidth: layer.width,
                      originFontSize: layer.fontSize,
                      startClientX: event.clientX,
                      startClientY: event.clientY,
                      stageWidth: stage.getBoundingClientRect().width,
                      stageHeight: stage.getBoundingClientRect().height,
                    });
                  }}
                />
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function StudioApp() {
  const [projects, setProjects] = useState<CoverProject[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [selectedLayerKey, setSelectedLayerKey] = useState<TextLayerKey>("title");
  const [isLoaded, setIsLoaded] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [statusMessage, setStatusMessage] = useState("Loading local studio...");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const uploadInputRef = useRef<HTMLInputElement | null>(null);

  const activeProject = useMemo(
    () => projects.find((project) => project.id === activeProjectId) ?? projects[0] ?? null,
    [activeProjectId, projects],
  );

  const selectedVariant = useMemo(() => {
    if (!activeProject?.selectedVariantId) {
      return activeProject?.variants[0] ?? null;
    }
    return activeProject.variants.find((variant) => variant.id === activeProject.selectedVariantId) ?? null;
  }, [activeProject]);

  useEffect(() => {
    async function loadProjects() {
      const storedProjects = await listStoredProjects();
      if (storedProjects.length > 0) {
        setProjects(storedProjects);
        const rememberedProjectId = window.localStorage.getItem(ACTIVE_PROJECT_STORAGE_KEY);
        setActiveProjectId(rememberedProjectId ?? storedProjects[0].id);
        setStatusMessage("Recovered local drafts from IndexedDB.");
      } else {
        const draft = createProjectDraft();
        await saveProject(draft);
        setProjects([draft]);
        setActiveProjectId(draft.id);
        setStatusMessage("Created your first local studio draft.");
      }
      setIsLoaded(true);
    }

    void loadProjects();
  }, []);

  useEffect(() => {
    if (!activeProjectId) {
      return;
    }
    window.localStorage.setItem(ACTIVE_PROJECT_STORAGE_KEY, activeProjectId);
  }, [activeProjectId]);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, []);

  function queueProjectSave(project: CoverProject) {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = setTimeout(() => {
      void saveProject(project).then(() => setStatusMessage("Saved locally to IndexedDB."));
    }, 250);
  }

  function mutateActiveProject(mutator: (project: CoverProject) => CoverProject) {
    setProjects((current) =>
      current.map((project) => {
        if (project.id !== activeProjectId) {
          return project;
        }
        const next = {
          ...mutator(project),
          updatedAt: new Date().toISOString(),
        };
        queueProjectSave(next);
        return next;
      }),
    );
  }

  function createNewProject() {
    const freshProject = createProjectDraft({
      title: "Untitled Cover",
      author: "Author Name",
      sourceText: "",
      name: "Untitled Cover",
    });
    setProjects((current) => [freshProject, ...current]);
    startTransition(() => setActiveProjectId(freshProject.id));
    setSelectedLayerKey("title");
    setStatusMessage("Created a new local draft.");
    void saveProject(freshProject);
  }

  async function handleGenerate() {
    if (!activeProject) {
      return;
    }

    if (activeProject.coverCreationMode === "upload_background") {
      setErrorMessage("Choose an image file first, then apply it as the background.");
      setStatusMessage("Upload mode is waiting for a background image.");
      return;
    }

    setErrorMessage(null);
    setIsGenerating(true);
    setStatusMessage("Generating cover variants with OpenAI...");

    try {
      const response = await fetch("/api/generate-cover", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: activeProject.title,
          author: activeProject.author,
          sourceMode: activeProject.sourceMode,
          sourceText: activeProject.sourceText,
          artDirectionPresetId: activeProject.artDirectionPresetId,
          customStylePrompt: activeProject.customStylePrompt,
          variantCount: 3,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.details ?? payload.error ?? "Cover generation failed.");
      }

      mutateActiveProject((project) => ({
        ...project,
        variants: payload.variants,
        selectedVariantId: payload.variants[0]?.id ?? null,
      }));
      setStatusMessage("Generated 3 new cover variants.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Cover generation failed.";
      setErrorMessage(message);
      setStatusMessage("Generation failed.");
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleExport() {
    if (!activeProject || !selectedVariant) {
      setErrorMessage("Generate or select a cover variant before exporting.");
      return;
    }

    setErrorMessage(null);
    setIsExporting(true);
    setStatusMessage("Rendering final export...");

    try {
      const blob = await renderCoverBlob(selectedVariant.imageDataUrl, [
        activeProject.textLayers.title,
        activeProject.textLayers.author,
      ], activeProject.exportSettings.format);

      const savedName = await saveBlobToUserFile(
        blob,
        activeProject.exportSettings.fileBaseName,
        activeProject.exportSettings.format,
      );
      setStatusMessage(`Exported ${savedName}.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Export failed.";
      setErrorMessage(message);
      setStatusMessage("Export failed.");
    } finally {
      setIsExporting(false);
    }
  }

  async function handleUploadedBackground(file: File) {
    if (!activeProject) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setErrorMessage("Only image files can be used as background uploads.");
      return;
    }

    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error("Failed to read the uploaded image."));
      reader.readAsDataURL(file);
    });

    mutateActiveProject((project) => {
      const uploadedVariant = createUploadedVariant(dataUrl);
      return {
        ...project,
        coverCreationMode: "upload_background",
        uploadedBackgroundDataUrl: dataUrl,
        variants: [uploadedVariant, ...project.variants.filter((variant) => variant.sourceType !== "upload")],
        selectedVariantId: uploadedVariant.id,
      };
    });
    setErrorMessage(null);
    setStatusMessage(`Applied uploaded background: ${file.name}`);
  }

  if (!isLoaded || !activeProject) {
    return <main className="app-loading">Preparing Cover4EBook Studio...</main>;
  }

  const canGenerate =
    activeProject.title.trim().length > 0 &&
    (activeProject.coverCreationMode === "upload_background"
      ? Boolean(activeProject.uploadedBackgroundDataUrl)
      : activeProject.sourceText.trim().length >= 20);

  return (
    <main className="studio-page">
      <aside className="sidebar">
        <div className="brand-block">
          <div className="brand-mark">Ink &amp; Ember</div>
          <div className="brand-subtitle">AI Cover Studio</div>
        </div>
        <button type="button" className="primary-sidebar-button" data-testid="new-project-button" onClick={createNewProject}>
          + New Project
        </button>
        <div className="sidebar-section">
          <div className="sidebar-section-title">Recent Drafts</div>
          <div className="project-list">
            {projects.map((project) => {
              const projectVariant =
                project.variants.find((variant) => variant.id === project.selectedVariantId) ?? project.variants[0] ?? null;
              return (
                <button
                  type="button"
                  key={project.id}
                  className={clsx("project-card", project.id === activeProject.id && "project-card-active")}
                  onClick={() => startTransition(() => setActiveProjectId(project.id))}
                >
                  <span
                    className="project-card-thumb"
                    style={
                      projectVariant
                        ? { backgroundImage: `url(${projectVariant.imageDataUrl})` }
                        : { background: artDirectionPresets.find((preset) => preset.id === project.artDirectionPresetId)?.preview }
                    }
                  />
                  <span className="project-card-copy">
                    <strong>{project.title || "Untitled Cover"}</strong>
                    <small>{new Date(project.updatedAt).toLocaleString()}</small>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
        <div className="sidebar-plan">
          <div className="sidebar-plan-title">Studio Notes</div>
          <p>Anonymous local workflow. Drafts stay in your browser unless you export a cover file.</p>
        </div>
      </aside>

      <section className="studio-main">
        <header className="studio-header">
          <div>
            <div className="studio-breadcrumb">Projects / {activeProject.name}</div>
            <h1 className="studio-title">Cover4EBook Studio</h1>
          </div>
          <div className="studio-status">{statusMessage}</div>
        </header>

        {errorMessage ? <div className="error-banner">{errorMessage}</div> : null}

        <div className="studio-grid">
          <section className="panel panel-form">
            <div className="panel-section">
              <div className="panel-number">1</div>
              <div>
                <h2>Book Details</h2>
                <p>Set the visible metadata that will stay editable on top of the artwork.</p>
              </div>
            </div>
            <div className="field-grid">
              <label className="field">
                <span>Book Title</span>
                <input
                  data-testid="book-title-input"
                  value={activeProject.title}
                  onChange={(event) =>
                    mutateActiveProject((project) => ({
                      ...project,
                      title: event.target.value,
                      name: event.target.value.trim() || "Untitled Cover",
                      textLayers: {
                        ...project.textLayers,
                        title: { ...project.textLayers.title, text: event.target.value },
                      },
                      exportSettings: {
                        ...project.exportSettings,
                        fileBaseName: slugify(event.target.value),
                      },
                    }))
                  }
                />
              </label>
              <label className="field">
                <span>Author</span>
                <input
                  data-testid="book-author-input"
                  value={activeProject.author}
                  onChange={(event) =>
                    mutateActiveProject((project) => ({
                      ...project,
                      author: event.target.value,
                      textLayers: {
                        ...project.textLayers,
                        author: { ...project.textLayers.author, text: event.target.value },
                      },
                    }))
                  }
                />
              </label>
            </div>

            <div className="panel-section">
              <div className="panel-number">2</div>
              <div>
                <h2>Cover Source</h2>
                <p>Choose between server-side OpenAI generation and a user-uploaded background fallback.</p>
              </div>
            </div>

            <div className="segmented-control" data-testid="cover-source-mode">
              {[
                { id: "ai_generate", label: "Generate with OpenAI" },
                { id: "upload_background", label: "Upload background" },
              ].map((option) => (
                <button
                  key={option.id}
                  type="button"
                  className={clsx(
                    "segmented-button",
                    activeProject.coverCreationMode === option.id && "segmented-button-active",
                  )}
                  onClick={() =>
                    mutateActiveProject((project) => ({
                      ...project,
                      coverCreationMode: option.id as CoverProject["coverCreationMode"],
                    }))
                  }
                >
                  {option.label}
                </button>
              ))}
            </div>

            {activeProject.coverCreationMode === "upload_background" ? (
              <div className="upload-panel" data-testid="upload-background-panel">
                <input
                  ref={uploadInputRef}
                  className="upload-input"
                  type="file"
                  accept="image/*"
                  data-testid="upload-background-input"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) {
                      void handleUploadedBackground(file);
                    }
                  }}
                />
                <button
                  type="button"
                  className="secondary-action-button"
                  data-testid="upload-background-button"
                  onClick={() => uploadInputRef.current?.click()}
                >
                  Choose Background Image
                </button>
                <p className="upload-help">
                  This fallback never calls the image API. The uploaded image becomes the cover art layer and the title and
                  author remain editable above it.
                </p>
                {activeProject.uploadedBackgroundDataUrl ? (
                  <p className="upload-selected">Background ready. You can now continue editing and exporting.</p>
                ) : null}
              </div>
            ) : (
              <>
                <div className="panel-section">
                  <div className="panel-number">3</div>
                  <div>
                    <h2>Source &amp; Direction</h2>
                    <p>Describe mood, paste the novel excerpt, or give a direct visual brief.</p>
                  </div>
                </div>

                <div className="segmented-control" data-testid="source-mode-control">
                  {[
                    { id: "story_mood", label: "Use story mood" },
                    { id: "excerpt", label: "Paste excerpt" },
                    { id: "direct_description", label: "Describe directly" },
                  ].map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      className={clsx(
                        "segmented-button",
                        activeProject.sourceMode === option.id && "segmented-button-active",
                      )}
                      onClick={() =>
                        mutateActiveProject((project) => ({
                          ...project,
                          sourceMode: option.id as CoverProject["sourceMode"],
                        }))
                      }
                    >
                      {option.label}
                    </button>
                  ))}
                </div>

                <label className="field">
                  <span>Source Text</span>
                  <textarea
                    rows={7}
                    data-testid="source-text-input"
                    value={activeProject.sourceText}
                    onChange={(event) =>
                      mutateActiveProject((project) => ({
                        ...project,
                        sourceText: event.target.value,
                      }))
                    }
                  />
                </label>

                <div className="panel-section">
                  <div className="panel-number">4</div>
                  <div>
                    <h2>Art Direction</h2>
                    <p>Start from a curated visual language, then add your own style note if needed.</p>
                  </div>
                </div>

                <div className="preset-grid">
                  {artDirectionPresets.map((preset) => (
                    <button
                      type="button"
                      key={preset.id}
                      className={clsx(
                        "preset-card",
                        activeProject.artDirectionPresetId === preset.id && "preset-card-active",
                      )}
                      onClick={() =>
                        mutateActiveProject((project) => ({
                          ...project,
                          artDirectionPresetId: preset.id,
                        }))
                      }
                    >
                      <span className="preset-card-thumb" style={{ background: preset.preview }} />
                      <span className="preset-card-title">{preset.label}</span>
                      <span className="preset-card-summary">{preset.summary}</span>
                    </button>
                  ))}
                </div>

                <label className="field">
                  <span>Optional Style Override</span>
                  <input
                    value={activeProject.customStylePrompt}
                    placeholder="Example: sparse moonlit composition, more sea mist, avoid characters"
                    onChange={(event) =>
                      mutateActiveProject((project) => ({
                        ...project,
                        customStylePrompt: event.target.value,
                      }))
                    }
                  />
                </label>

                <button
                  type="button"
                  className="generate-button"
                  data-testid="generate-covers-button"
                  disabled={!canGenerate || isGenerating}
                  onClick={() => void handleGenerate()}
                >
                  {isGenerating ? "Generating Covers..." : "Generate Covers"}
                </button>
              </>
            )}

            {activeProject.coverCreationMode === "upload_background" ? (
              <button
                type="button"
                className="generate-button"
                data-testid="use-uploaded-background-button"
                disabled={!canGenerate}
                onClick={() => {
                  setErrorMessage(null);
                  setStatusMessage("Uploaded background is active. Continue editing on the canvas.");
                }}
              >
                Use Uploaded Background
              </button>
            ) : null}
          </section>

          <section className="panel panel-preview">
            <PreviewStage
              project={activeProject}
              selectedVariant={selectedVariant}
              selectedLayerKey={selectedLayerKey}
              onSelectLayer={setSelectedLayerKey}
              onMoveLayer={(key, x, y) =>
                mutateActiveProject((project) => ({
                  ...project,
                  textLayers: {
                    ...project.textLayers,
                    [key]: {
                      ...project.textLayers[key],
                      x,
                      y,
                    },
                  },
                }))
              }
              onResizeLayer={(key, width, fontSize) =>
                mutateActiveProject((project) => ({
                  ...project,
                  textLayers: {
                    ...project.textLayers,
                    [key]: {
                      ...project.textLayers[key],
                      width,
                      fontSize,
                    },
                  },
                }))
              }
            />

            <div className="variant-strip">
              <div className="variant-strip-title">Generated Variants</div>
              <div className="variant-list" data-testid="variant-strip">
                {activeProject.variants.length === 0 ? (
                  <div className="variant-empty">Generate a cover set to populate this strip.</div>
                ) : (
                  activeProject.variants.map((variant) => (
                    <button
                      type="button"
                      key={variant.id}
                      className={clsx(
                        "variant-card",
                        activeProject.selectedVariantId === variant.id && "variant-card-active",
                      )}
                      data-testid={`variant-card-${variant.id}`}
                      onClick={() =>
                        mutateActiveProject((project) => ({
                          ...project,
                          selectedVariantId: variant.id,
                        }))
                      }
                    >
                      <span className="variant-card-image" style={{ backgroundImage: `url(${variant.imageDataUrl})` }} />
                    </button>
                  ))
                )}
              </div>
            </div>
          </section>

          <section className="panel panel-inspector">
            <div className="inspector-tabs">
              <span className="inspector-tab inspector-tab-active">Text</span>
              <span className="inspector-tab">Design</span>
            </div>

            {(["title", "author"] as const).map((layerKey) => {
              const layer = activeProject.textLayers[layerKey];
              return (
                <section key={layerKey} className="inspector-group">
                  <div className="inspector-group-title">{layerKey === "title" ? "Title" : "Author"}</div>
                  <label className="field">
                    <span>Text (press Enter for manual line breaks)</span>
                    <textarea
                      rows={layerKey === "title" ? 4 : 3}
                      value={layer.text}
                      data-testid={layerKey === "title" ? "title-text-input" : "author-text-input"}
                      onFocus={() => setSelectedLayerKey(layerKey)}
                      onChange={(event) =>
                        mutateActiveProject((project) => ({
                          ...project,
                          textLayers: {
                            ...project.textLayers,
                            [layerKey]: {
                              ...project.textLayers[layerKey],
                              text: event.target.value,
                            },
                          },
                        }))
                      }
                    />
                  </label>
                  <label className="field">
                    <span>Font</span>
                    <select
                      value={layer.fontFamily}
                      onChange={(event) =>
                        mutateActiveProject((project) => ({
                          ...project,
                          textLayers: {
                            ...project.textLayers,
                            [layerKey]: {
                              ...project.textLayers[layerKey],
                              fontFamily: event.target.value as TextLayer["fontFamily"],
                            },
                          },
                        }))
                      }
                    >
                      {fontOptions.map((font) => (
                        <option key={font.id} value={font.id}>
                          {font.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className="field-inline-grid">
                    <label className="field">
                      <span>Size</span>
                      <input
                        type="number"
                        min={14}
                        max={140}
                        value={layer.fontSize}
                        onChange={(event) =>
                          mutateActiveProject((project) => ({
                            ...project,
                            textLayers: {
                              ...project.textLayers,
                              [layerKey]: {
                                ...project.textLayers[layerKey],
                                fontSize: Number(event.target.value),
                              },
                            },
                          }))
                        }
                      />
                    </label>
                    <label className="field">
                      <span>Weight</span>
                      <input
                        type="number"
                        min={300}
                        max={900}
                        step={100}
                        value={layer.fontWeight}
                        onChange={(event) =>
                          mutateActiveProject((project) => ({
                            ...project,
                            textLayers: {
                              ...project.textLayers,
                              [layerKey]: {
                                ...project.textLayers[layerKey],
                                fontWeight: Number(event.target.value),
                              },
                            },
                          }))
                        }
                      />
                    </label>
                  </div>
                  <div className="field-inline-grid">
                    <label className="field">
                      <span>Spacing</span>
                      <input
                        type="number"
                        min={-4}
                        max={12}
                        step={0.1}
                        value={layer.letterSpacing}
                        onChange={(event) =>
                          mutateActiveProject((project) => ({
                            ...project,
                            textLayers: {
                              ...project.textLayers,
                              [layerKey]: {
                                ...project.textLayers[layerKey],
                                letterSpacing: Number(event.target.value),
                              },
                            },
                          }))
                        }
                      />
                    </label>
                    <label className="field">
                      <span>Line Height</span>
                      <input
                        type="number"
                        min={0.8}
                        max={1.8}
                        step={0.01}
                        value={layer.lineHeight}
                        onChange={(event) =>
                          mutateActiveProject((project) => ({
                            ...project,
                            textLayers: {
                              ...project.textLayers,
                              [layerKey]: {
                                ...project.textLayers[layerKey],
                                lineHeight: Number(event.target.value),
                              },
                            },
                          }))
                        }
                      />
                    </label>
                  </div>
                  <div className="field-inline-grid">
                    <label className="field">
                      <span>Color</span>
                      <input
                        type="color"
                        data-testid={layerKey === "title" ? "title-color-input" : "author-color-input"}
                        value={layer.color}
                        onChange={(event) =>
                          mutateActiveProject((project) => ({
                            ...project,
                            textLayers: {
                              ...project.textLayers,
                              [layerKey]: {
                                ...project.textLayers[layerKey],
                                color: event.target.value,
                              },
                            },
                          }))
                        }
                      />
                    </label>
                    <label className="field field-checkbox">
                      <span>Uppercase</span>
                      <input
                        type="checkbox"
                        checked={layer.uppercase}
                        onChange={(event) =>
                          mutateActiveProject((project) => ({
                            ...project,
                            textLayers: {
                              ...project.textLayers,
                              [layerKey]: {
                                ...project.textLayers[layerKey],
                                uppercase: event.target.checked,
                              },
                            },
                          }))
                        }
                      />
                    </label>
                  </div>
                  <div className="align-buttons">
                    {(["left", "center", "right"] as const).map((align) => (
                      <button
                        type="button"
                        key={align}
                        className={clsx("align-button", layer.align === align && "align-button-active")}
                        onClick={() =>
                          mutateActiveProject((project) => ({
                            ...project,
                            textLayers: {
                              ...project.textLayers,
                              [layerKey]: {
                                ...project.textLayers[layerKey],
                                align: align as TextAlign,
                              },
                            },
                          }))
                        }
                      >
                        {align}
                      </button>
                    ))}
                  </div>
                </section>
              );
            })}

            <section className="inspector-group">
              <div className="inspector-group-title">Layout Presets</div>
              <div className="layout-preset-list">
                {layoutPresets.map((preset) => (
                  <button
                    type="button"
                    key={preset.id}
                    className={clsx(
                      "layout-preset-card",
                      activeProject.layoutPresetId === preset.id && "layout-preset-card-active",
                    )}
                    onClick={() =>
                      mutateActiveProject((project) => {
                        const nextLayers = applyLayoutPreset(
                          preset.id as LayoutPresetId,
                          project.textLayers.title,
                          project.textLayers.author,
                        );
                        return {
                          ...project,
                          layoutPresetId: preset.id as LayoutPresetId,
                          textLayers: {
                            title: nextLayers.title,
                            author: nextLayers.author,
                          },
                        };
                      })
                    }
                  >
                    <strong>{preset.label}</strong>
                    <span>{preset.description}</span>
                  </button>
                ))}
              </div>
            </section>

            <section className="inspector-group">
              <div className="inspector-group-title">Export</div>
              <div className="format-buttons">
                {(["png", "jpg", "webp", "pdf"] as const).map((format) => (
                  <button
                    type="button"
                    key={format}
                    className={clsx(
                      "format-button",
                      activeProject.exportSettings.format === format && "format-button-active",
                    )}
                    data-testid={`export-format-${format}`}
                    onClick={() =>
                      mutateActiveProject((project) => ({
                        ...project,
                        exportSettings: {
                          ...project.exportSettings,
                          format,
                        },
                      }))
                    }
                  >
                    {format.toUpperCase()}
                  </button>
                ))}
              </div>
              <label className="field">
                <span>Base File Name</span>
                <input
                  value={activeProject.exportSettings.fileBaseName}
                  onChange={(event) =>
                    mutateActiveProject((project) => ({
                      ...project,
                      exportSettings: {
                        ...project.exportSettings,
                        fileBaseName: slugify(event.target.value),
                      },
                    }))
                  }
                />
              </label>
              <label className="field">
                <span>Quality</span>
                <select
                  value={activeProject.exportSettings.quality}
                  onChange={(event) =>
                    mutateActiveProject((project) => ({
                      ...project,
                      exportSettings: {
                        ...project.exportSettings,
                        quality: event.target.value as CoverProject["exportSettings"]["quality"],
                      },
                    }))
                  }
                >
                  <option value="print">High (300 DPI export intent)</option>
                  <option value="web">Web (fast preview export intent)</option>
                </select>
              </label>
              <button
                type="button"
                className="export-button"
                disabled={isExporting || !selectedVariant}
                data-testid="export-cover-button"
                onClick={() => void handleExport()}
              >
                {isExporting ? "Exporting..." : "Export Cover"}
              </button>
            </section>
          </section>
        </div>
      </section>
    </main>
  );
}
