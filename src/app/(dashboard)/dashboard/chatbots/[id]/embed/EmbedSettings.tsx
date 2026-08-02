"use client";

import { useState } from "react";
import { Copy, Check, Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";

interface Props {
  chatbotId: string;
  chatbotName: string;
  isPublished: boolean;
  baseUrl: string;
}

export function EmbedSettings({ chatbotId, chatbotName, isPublished, baseUrl }: Props) {
  const router = useRouter();
  const [published, setPublished] = useState(isPublished);
  const [toggling, setToggling] = useState(false);
  const [copiedIframe, setCopiedIframe] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);

  const togglePublish = async () => {
    setToggling(true);
    await fetch("/api/chatbots/toggle-publish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chatbotId, published: !published }),
    });
    setPublished(!published);
    setToggling(false);
    router.refresh();
  };

  const iframeCode = `<iframe
  src="${baseUrl}/embed/${chatbotId}"
  style="position:fixed;bottom:0;right:0;width:400px;height:600px;border:none;z-index:9999"
  title="${chatbotName}"
></iframe>`;

  const scriptCode = `<script>
  (function() {
    var s = document.createElement('script');
    s.src = '${baseUrl}/embed/${chatbotId}/widget.js';
    s.async = true;
    s.dataset.chatbot = '${chatbotId}';
    document.head.appendChild(s);
  })();
</script>`;

  const copyText = async (text: string, setter: (v: boolean) => void) => {
    await navigator.clipboard.writeText(text);
    setter(true);
    setTimeout(() => setter(false), 2000);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between rounded-lg border p-4">
        <div>
          <p className="font-medium">Widget Status</p>
          <p className="text-sm text-gray-500">
            {published ? "Widget is accessible on your site" : "Widget is hidden from visitors"}
          </p>
        </div>
        <button
          onClick={togglePublish}
          disabled={toggling}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium ${
            published
              ? "bg-green-100 text-green-700 hover:bg-green-200"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          {published ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          {published ? "Published" : "Unpublished"}
        </button>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-2">Iframe</h2>
        <p className="text-sm text-gray-500 mb-3">
          Paste this where you want the widget to appear.
        </p>
        <div className="relative">
          <pre className="bg-gray-50 border rounded-lg p-4 text-xs overflow-x-auto whitespace-pre-wrap">
            {iframeCode}
          </pre>
          <button
            onClick={() => copyText(iframeCode, setCopiedIframe)}
            className="absolute top-2 right-2 rounded-md bg-white border px-2 py-1 text-xs hover:bg-gray-50 flex items-center gap-1"
          >
            {copiedIframe ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            {copiedIframe ? "Copied" : "Copy"}
          </button>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-2">Script Tag</h2>
        <p className="text-sm text-gray-500 mb-3">
          Paste in the &lt;head&gt; of your website. Loads automatically.
        </p>
        <div className="relative">
          <pre className="bg-gray-50 border rounded-lg p-4 text-xs overflow-x-auto whitespace-pre-wrap">
            {scriptCode}
          </pre>
          <button
            onClick={() => copyText(scriptCode, setCopiedScript)}
            className="absolute top-2 right-2 rounded-md bg-white border px-2 py-1 text-xs hover:bg-gray-50 flex items-center gap-1"
          >
            {copiedScript ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            {copiedScript ? "Copied" : "Copy"}
          </button>
        </div>
      </div>
    </div>
  );
}
