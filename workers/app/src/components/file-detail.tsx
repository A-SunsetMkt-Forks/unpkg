import { type VNode } from "preact";
import prettyBytes from "pretty-bytes";

import { type PackageInfo } from "../pkg-info.js";
import { highlightCode } from "../highlight.ts";
import { HrefsContext } from "../hrefs.ts";
import { getLanguageName } from "../language-names.ts";
import { type PackageFile } from "../www-worker.ts";

import { getContext } from "./app-context.ts";
import { CodeViewer } from "./code-viewer.tsx";
import { FilesHeader } from "./files-header.tsx";
import { FilesLayout } from "./files-layout.tsx";
import { FilesNav } from "./files-nav.tsx";
import { Hydrate } from "./hydrate.tsx";
import { ImageViewer } from "./image-viewer.tsx";

export function FileDetail({
  packageInfo,
  version,
  filename,
  file,
}: {
  packageInfo: PackageInfo;
  version: string;
  filename: string;
  file: PackageFile;
}): VNode {
  let hrefs = getContext(HrefsContext);
  let rawHref = hrefs.raw(packageInfo.name, version, filename);

  let lines: string[] | undefined;

  let content: VNode;
  if (file.type.startsWith("text/") || file.type === "application/json") {
    let text = new TextDecoder().decode(file.body);
    let html = highlightCode(text);
    lines = text.split("\n");
    content = (
      <Hydrate>
        <CodeViewer html={html} numLines={lines.length} />
      </Hydrate>
    );
  } else if (file.type.startsWith("image/")) {
    content = <ImageViewer alt={filename} src={rawHref} />;
  } else {
    content = (
      <div class="py-4 border-b border-x border-slate-300 bg-white text-center">
        No preview is available for this file.
      </div>
    );
  }

  return (
    <FilesLayout>
      <FilesHeader packageInfo={packageInfo} version={version} filename={filename} />

      <FilesNav packageInfo={packageInfo} version={version} filename={filename} />

      <div class="p-3 border border-slate-300 bg-slate-100 text-sm flex justify-between select-none">
        <div class="w-64">
          {lines == null ? "" : <LineCount lines={lines} />}
          <span>{prettyBytes(file.size)}</span>
        </div>
        <div class="hidden flex-grow sm:block text-center">{getLanguageName(file)}</div>
        <div class="w-64 hidden sm:block text-right">
          <a href={rawHref} class="py-1 px-2 border border-slate-300 bg-slate-100 hover:bg-slate-200 rounded-sm">
            View Raw
          </a>
        </div>
      </div>

      {content}
    </FilesLayout>
  );
}

function LineCount({ lines }: { lines: string[] }): VNode {
  let loc = lines.filter((line) => line.trim() !== "").length;

  return (
    <span>
      <span>{formatNumber(lines.length)} lines </span>
      {lines.length !== loc ? <span>({formatNumber(loc)} loc) </span> : null}
      <span>&bull; </span>
    </span>
  );
}

function formatNumber(num: number): string {
  return new Intl.NumberFormat("en").format(num);
}
