<template>
	<div class="html-editor-interface">
		<!-- Tab Navigation -->
		<div class="tab-navigation" v-if="!splitView">
			<button 
				:class="{ active: activeTab === 'editor' }" 
				@click="activeTab = 'editor'"
				class="tab-button"
			>
				<v-icon name="code" small /> Editor
			</button>
			<button 
				:class="{ active: activeTab === 'preview' }" 
				@click="activeTab = 'preview'"
				class="tab-button"
			>
				<v-icon name="visibility" small /> Preview
			</button>
		</div>

		<!-- Split View or Tabbed Content -->
		<div class="editor-container" :class="{ 'split-view': splitView }">
			<!-- Editor Section -->
			<div v-if="activeTab === 'editor' || splitView" class="editor-section">
				<div class="editor-header">
					<span class="editor-title">HTML Code</span>
					<div class="editor-actions">
						<button @click="formatCode" class="action-button" title="Format Code">
							<v-icon name="auto_fix_high" small />
						</button>
						<button @click="clearCode" class="action-button" title="Clear Code">
							<v-icon name="clear" small />
						</button>
					</div>
				</div>
				<textarea
					ref="codeEditor"
					v-model="localValue"
					:placeholder="placeholder"
					:style="{ height: editorHeight + 'px' }"
					class="code-editor"
					@input="onInput"
					@keydown="handleKeydown"
					spellcheck="false"
				></textarea>
				<div class="editor-footer">
					Lines: {{ lineCount }} | Characters: {{ characterCount }}
				</div>
			</div>

			<!-- Preview Section -->
			<div v-if="activeTab === 'preview' || splitView" class="preview-section">
				<div class="preview-header">
					<span class="preview-title">Live Preview</span>
					<div class="preview-actions">
						<button @click="refreshPreview" class="action-button" title="Refresh Preview">
							<v-icon name="refresh" small />
						</button>
						<button @click="openInNewWindow" class="action-button" title="Open in New Window">
							<v-icon name="open_in_new" small />
						</button>
						<button @click="toggleFullscreen" class="action-button" title="Toggle Fullscreen">
							<v-icon name="fullscreen" small />
						</button>
					</div>
				</div>
				<div class="preview-container" :style="{ height: editorHeight + 'px' }">
					<iframe
						ref="previewFrame"
						class="preview-iframe"
						:srcdoc="previewContent"
						sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-pointer-lock allow-modals"
						@load="onPreviewLoad"
					></iframe>
				</div>
			</div>
		</div>

		<!-- Error Display -->
		<div v-if="hasError" class="error-message">
			<v-icon name="error" small /> 
			{{ errorMessage }}
		</div>
	</div>
</template>

<script>
import { ref, computed, watch, nextTick } from 'vue';

export default {
	props: {
		value: {
			type: String,
			default: '',
		},
		disabled: {
			type: Boolean,
			default: false,
		},
		placeholder: {
			type: String,
			default: 'Enter your HTML code here...',
		},
		height: {
			type: Number,
			default: 400,
		},
		show_preview: {
			type: Boolean,
			default: true,
		},
		split_view: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['input'],
	setup(props, { emit }) {
		const localValue = ref(props.value || '');
		const activeTab = ref(props.show_preview ? 'preview' : 'editor');
		const hasError = ref(false);
		const errorMessage = ref('');
		const codeEditor = ref(null);
		const previewFrame = ref(null);

		// Computed properties
		const editorHeight = computed(() => props.height);
		const splitView = computed(() => props.split_view);
		
		const lineCount = computed(() => {
			return localValue.value.split('\n').length;
		});

		const characterCount = computed(() => {
			return localValue.value.length;
		});

		const previewContent = computed(() => {
			if (!localValue.value.trim()) {
				return '<html><body><p style="color: #666; text-align: center; margin-top: 50px;">No content to preview</p></body></html>';
			}
			
			const content = localValue.value.trim();
			
			// If it's already a complete HTML document, enhance it for canvas support
			if (content.toLowerCase().includes('<!doctype') || content.toLowerCase().includes('<html')) {
				return enhanceHtmlForCanvas(content);
			}
			
			// If it's just HTML fragments, wrap them properly
			return '<!DOCTYPE html>\n' +
				'<html>\n' +
				'<head>\n' +
				'\t<meta charset="UTF-8">\n' +
				'\t<meta name="viewport" content="width=device-width, initial-scale=1.0">\n' +
				'\t<title>Preview</title>\n' +
				'</head>\n' +
				'<body>\n' +
				content + '\n' +
				'</body>\n' +
				'</html>';
		});

		// Canvas enhancement function
		const enhanceHtmlForCanvas = (html) => {
			let enhanced = html;
			
			// Ensure proper viewport meta tag
			if (!enhanced.toLowerCase().includes('viewport')) {
				enhanced = enhanced.replace(
					/<head>/i,
					'<head>\n\t<meta name="viewport" content="width=device-width, initial-scale=1.0">'
				);
			}
			
			// Add canvas-specific CSS for better rendering in iframe
			const canvasCSS = `<style>
/* Canvas and iframe enhancements */
html, body {
	margin: 0;
	padding: 0;
	overflow-x: auto;
}

/* Canvas container improvements */
canvas {
	max-width: 100%;
	height: auto;
	display: block;
}

/* Responsive canvas containers */
.w-full.aspect-square, [class*="aspect-square"] {
	width: 100% !important;
	height: auto !important;
	aspect-ratio: 1 / 1;
}

/* Container sizing fixes */
.max-w-4xl, [class*="max-w-"] {
	max-width: 100% !important;
	margin: 0 auto;
}

/* Grid responsiveness */
@media (max-width: 768px) {
	.grid-cols-1.md\\:grid-cols-2, [class*="md:grid-cols-"] {
		grid-template-columns: 1fr !important;
	}
}

/* Ensure interactive elements work properly */
input[type="range"], input[type="number"] {
	width: 100%;
}
</style>`;
			
			// Insert CSS before closing head tag
			enhanced = enhanced.replace(
				/<\/head>/i,
				canvasCSS + '\n</head>'
			);
			
			// Add canvas-specific JavaScript enhancements
			const canvasJS = `<script>
// Canvas and iframe compatibility enhancements
(function() {
	// Ensure proper initialization timing
	function initializeCanvas() {
		// Trigger resize events to help with canvas sizing
		setTimeout(function() {
			window.dispatchEvent(new Event('resize'));
		}, 100);
		
		// Additional canvas initialization
		const canvases = document.querySelectorAll('canvas');
		canvases.forEach(function(canvas) {
			if (canvas.getContext && !canvas.hasAttribute('data-initialized')) {
				// Mark as initialized to prevent double-init
				canvas.setAttribute('data-initialized', 'true');
				
				// Force canvas to recalculate size
				setTimeout(function() {
					window.dispatchEvent(new Event('resize'));
				}, 200);
			}
		});
	}
	
	// Initialize based on document state
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', initializeCanvas);
	} else {
		initializeCanvas();
	}
	
	// Listen for resize events
	window.addEventListener('resize', function() {
		setTimeout(function() {
			window.dispatchEvent(new Event('resize'));
		}, 50);
	});
	
	// Handle canvas parent resize
	function observeCanvasContainers() {
		if (window.ResizeObserver) {
			const observer = new ResizeObserver(function() {
				setTimeout(function() {
					window.dispatchEvent(new Event('resize'));
				}, 100);
			});
			
			document.querySelectorAll('canvas').forEach(function(canvas) {
				if (canvas.parentElement) {
					observer.observe(canvas.parentElement);
				}
			});
		}
	}
	
	// Start observing after a delay
	setTimeout(observeCanvasContainers, 500);
})();
<\/script>`;
			
			// Insert JavaScript before closing body tag
			enhanced = enhanced.replace(
				/<\/body>/i,
				canvasJS + '\n</body>'
			);
			
			return enhanced;
		};

		// Watch for prop changes
		watch(() => props.value, (newValue) => {
			if (newValue !== localValue.value) {
				localValue.value = newValue || '';
			}
		});

		// Watch for tab changes to refresh canvas
		watch(activeTab, (newTab) => {
			if (newTab === 'preview') {
				nextTick(() => {
					setTimeout(() => {
						onPreviewLoad();
					}, 100);
				});
			}
		});

		// Methods
		const onInput = () => {
			emit('input', localValue.value);
			validateHtml();
		};

		const validateHtml = () => {
			hasError.value = false;
			errorMessage.value = '';
			
			// Basic HTML validation
			const content = localValue.value.trim();
			if (content) {
				// Check for basic HTML structure issues
				const openTags = content.match(/<[^/][^>]*>/g) || [];
				const closeTags = content.match(/<\/[^>]+>/g) || [];
				
				if (openTags.length !== closeTags.length) {
					// This is just a warning, not blocking
					hasError.value = true;
					errorMessage.value = 'Warning: Possible unclosed HTML tags detected';
				}
			}
		};

		const formatCode = () => {
			// Basic HTML formatting
			let formatted = localValue.value
				.replace(/></g, '>\n<')
				.replace(/^\s+|\s+$/g, '');
			
			// Simple indentation
			const lines = formatted.split('\n');
			let indentLevel = 0;
			const indentSize = 2;
			
			formatted = lines.map(line => {
				const trimmed = line.trim();
				if (trimmed.startsWith('</')) {
					indentLevel = Math.max(0, indentLevel - 1);
				}
				
				const indented = ' '.repeat(indentLevel * indentSize) + trimmed;
				
				if (trimmed.startsWith('<') && !trimmed.startsWith('</') && !trimmed.endsWith('/>')) {
					indentLevel++;
				}
				
				return indented;
			}).join('\n');
			
			localValue.value = formatted;
			emit('input', localValue.value);
		};

		const clearCode = () => {
			if (confirm('Are you sure you want to clear all code?')) {
				localValue.value = '';
				emit('input', '');
			}
		};

		const refreshPreview = () => {
			if (previewFrame.value) {
				// Force iframe refresh
				const currentSrc = previewFrame.value.src;
				previewFrame.value.src = 'about:blank';
				setTimeout(() => {
					previewFrame.value.src = currentSrc;
				}, 50);
			}
		};

		const openInNewWindow = () => {
			if (!localValue.value) return;
			
			const newWindow = window.open('', '_blank');
			if (newWindow) {
				newWindow.document.write(previewContent.value);
				newWindow.document.close();
			}
		};

		const toggleFullscreen = () => {
			// Basic fullscreen implementation
			if (previewFrame.value) {
				if (previewFrame.value.requestFullscreen) {
					previewFrame.value.requestFullscreen();
				}
			}
		};

		const handleKeydown = (event) => {
			// Tab key handling for indentation
			if (event.key === 'Tab') {
				event.preventDefault();
				const start = event.target.selectionStart;
				const end = event.target.selectionEnd;
				
				// Insert tab character
				localValue.value = localValue.value.substring(0, start) + 
					'  ' + localValue.value.substring(end);
				
				// Move cursor
				nextTick(() => {
					event.target.selectionStart = event.target.selectionEnd = start + 2;
				});
			}
		};

		const onPreviewLoad = () => {
			// Enhanced preview load handling for canvas support
			nextTick(() => {
				try {
					const iframe = previewFrame.value;
					if (iframe && iframe.contentWindow) {
						// Trigger resize event to help canvas elements
						setTimeout(() => {
							iframe.contentWindow.dispatchEvent(new Event('resize'));
						}, 150);
						
						// Additional canvas initialization if needed
						setTimeout(() => {
							iframe.contentWindow.dispatchEvent(new Event('resize'));
						}, 300);
					}
				} catch (e) {
					// Ignore cross-origin errors
					console.log('Preview loaded (cross-origin restrictions apply)');
				}
			});
		};

		return {
			localValue,
			activeTab,
			hasError,
			errorMessage,
			codeEditor,
			previewFrame,
			editorHeight,
			splitView,
			lineCount,
			characterCount,
			previewContent,
			onInput,
			formatCode,
			clearCode,
			refreshPreview,
			openInNewWindow,
			toggleFullscreen,
			handleKeydown,
			onPreviewLoad,
		};
	},
};
</script>

<style scoped>
.html-editor-interface {
	border: 1px solid var(--border-color);
	border-radius: 6px;
	overflow: hidden;
}

.tab-navigation {
	display: flex;
	background: var(--background-subdued);
	border-bottom: 1px solid var(--border-color);
}

.tab-button {
	padding: 8px 16px;
	border: none;
	background: transparent;
	cursor: pointer;
	display: flex;
	align-items: center;
	gap: 6px;
	color: var(--foreground-subdued);
	transition: all 0.2s;
}

.tab-button:hover {
	background: var(--background-normal);
	color: var(--foreground);
}

.tab-button.active {
	background: var(--background-normal);
	color: var(--primary);
	border-bottom: 2px solid var(--primary);
}

.editor-container {
	display: flex;
	flex-direction: column;
}

.editor-container.split-view {
	flex-direction: row;
}

.editor-section,
.preview-section {
	flex: 1;
	display: flex;
	flex-direction: column;
}

.split-view .editor-section {
	border-right: 1px solid var(--border-color);
}

.editor-header,
.preview-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 8px 12px;
	background: var(--background-subdued);
	border-bottom: 1px solid var(--border-color);
	font-size: 14px;
	font-weight: 500;
}

.editor-actions,
.preview-actions {
	display: flex;
	gap: 4px;
}

.action-button {
	padding: 4px 8px;
	border: none;
	background: transparent;
	cursor: pointer;
	border-radius: 4px;
	color: var(--foreground-subdued);
	transition: all 0.2s;
}

.action-button:hover {
	background: var(--background-normal);
	color: var(--foreground);
}

.code-editor {
	width: 100%;
	border: none;
	outline: none;
	padding: 16px;
	font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
	font-size: 14px;
	line-height: 1.5;
	resize: none;
	background: var(--background-page);
	color: var(--foreground);
}

.editor-footer {
	padding: 8px 12px;
	background: var(--background-subdued);
	border-top: 1px solid var(--border-color);
	font-size: 12px;
	color: var(--foreground-subdued);
}

.preview-container {
	position: relative;
	flex: 1;
}

.preview-iframe {
	width: 100%;
	height: 100%;
	border: none;
	background: white;
}

.error-message {
	padding: 8px 12px;
	background: var(--danger-alt);
	color: var(--danger);
	font-size: 14px;
	display: flex;
	align-items: center;
	gap: 6px;
}
</style>