# Using Vision Models with Local AI

## ⚠️ Important: Gemma 3 Does NOT Support Vision

**Gemma 3** is a text-only model and **cannot analyze images**. To use this plant health app with local AI, you need a **vision-capable (multimodal) model**.

## ✅ Recommended Vision Models for LM Studio

### Best for Plant Analysis (Tested & Working)

1. **Qwen2-VL 7B Instruct** ⭐ **RECOMMENDED**
   - Model: `Qwen/Qwen2.5-VL-7B-Instruct`
   - Size: ~8GB VRAM
   - Quality: Excellent vision understanding and reasoning
   - Speed: Fast inference, optimized performance
   - Special: Superior at detailed image analysis, multilingual support
   - Best for: Most users with mid-range GPUs (RTX 3060/4060+)

2. **MiniCPM-V 2.6** (Smallest, Good Quality)
   - Model: `openbmb/MiniCPM-V-2_6`
   - Size: ~6GB VRAM
   - Quality: Excellent quality-to-size ratio
   - Speed: Very fast and efficient
   - Special: Supports high-resolution images
   - Best for: Users with limited VRAM (6-8GB)

3. **InternVL 2.5 8B** (High Accuracy)
   - Model: `OpenGVLab/InternVL2_5-8B`
   - Size: ~16GB
   - Quality: Very high accuracy
   - Speed: Moderate (needs good GPU)

### Alternative Options

4. **CogVLM2-LLaMA3** (Advanced)
   - Model: `THUDM/cogvlm2-llama3-chat-19B`
   - Size: ~19GB (requires strong GPU)
   - Quality: Very high
   - Speed: Slower but very accurate



## 🚀 Quick Setup with LM Studio

### Step 1: Download a Vision Model

1. Open LM Studio
2. Click "Search" or "Discover"
3. Search for **recommended model**:
   ```
   Qwen2.5-VL-7B-Instruct
   ```
   Or alternatives:
   ```
   MiniCPM-V-2.6          (if you have limited VRAM)
   
   ```
4. Download the model (GGUF format, Q4_K_M quantization recommended for balance)

### Step 2: Load the Model

1. Go to "Chat" tab
2. Select your vision model from the dropdown
3. Make sure it says **(Multimodal)** or **(Vision)** next to the name
4. Click "Start Server" or enable "Local Server"

### Step 3: Configure in Fedai

1. Open http://localhost:5173
2. Click the robot icon (🤖)
3. Select "Local OpenAI-Compatible"
4. Click "LM Studio" preset (or enter `http://localhost:1234/v1`)
5. Click "Test Connection" → Should succeed
6. Save settings

### Step 4: Test with Plant Image

1. Click "Start Diagnosis"
2. Upload a plant photo
3. Add description (optional)
4. Click "Analyze"
5. The local vision model will analyze the image!

## 📊 Model Comparison

| Model | Size | VRAM | Speed | Quality | Best For |
|-------|------|------|-------|---------|----------|
| LLaVA 1.6 7B | 4GB | 6GB | ⚡⚡⚡ | ⭐⭐⭐⭐ | General use |
| MiniCPM-V 2.6 | 8GB | 10GB | ⚡⚡⚡ | ⭐⭐⭐⭐⭐ | Best balance |
| Qwen2-VL 7B | 8GB | 10GB | ⚡⚡⚡ | ⭐⭐⭐⭐⭐ | Multilingual |
| InternVL 2.5 8B | 16GB | 18GB | ⚡⚡ | ⭐⭐⭐⭐⭐ | High accuracy |
| CogVLM2 19B | 19GB | 24GB | ⚡ | ⭐⭐⭐⭐⭐ | Advanced use |
| LLaVA 1.7 34B | 34GB | 40GB+ | ⚡ | ⭐⭐⭐⭐⭐ | Maximum quality |

## 🔧 Troubleshooting

### "Model doesn't support images"
- Your model is text-only
- Download a vision model from the list above
- Verify the model name includes "LLaVA", "MiniCPM-V", "Qwen-VL", etc.

### "Connection refused"
- Make sure LM Studio server is running
- Check the port is 1234 (or update base URL)
- Verify firewall isn't blocking localhost

### "Out of memory" error
- Your GPU doesn't have enough VRAM
- Try a smaller model (7B instead of 13B/34B)
- Use CPU inference (slower but works)
- Reduce context length in LM Studio settings

### Analysis takes too long
- Use a smaller/faster model (LLaVA 7B, MiniCPM-V)
- Enable GPU acceleration in LM Studio
- Reduce max tokens to 2048
- Use quantized models (Q4_K_M or Q5_K_M)

### Poor results / Generic responses
- Use a larger model (13B or 19B)
- Increase temperature (0.7-0.9)
- Make sure the image is clear and well-lit
- Add more detailed description

## 💡 Pro Tips

1. **Image Quality Matters**
   - Use high-resolution images (but not too large)
   - Good lighting helps significantly
   - Close-up shots of affected areas work best

2. **Model Selection**
   - 7B models: Good for quick testing
   - 13B models: Best balance of speed/quality
   - 19B+ models: Best quality but slow

3. **Performance Optimization**
   - Use GGUF Q4_K_M or Q5_K_M quantization
   - Enable GPU acceleration
   - Keep context length reasonable (4096 max)
   - Use Metal (Mac) or CUDA (Windows/Linux)

4. **For Best Plant Analysis**
   - MiniCPM-V 2.6: Best overall
   - Qwen2-VL 7B: Great multilingual support
   - LLaVA 1.6 13B: Good balance of speed/quality

## 🌐 Other Local AI Servers

### llama.cpp (Advanced Users)
```bash
./llama-server -m llava-v1.6-vicuna-7b.gguf --port 8080 --chat-template llava
```
Base URL: `http://localhost:8080/v1`

### KoboldCpp (Windows Friendly)
```bash
python koboldcpp.py llava-model.gguf --port 5001 --usecublas
```
Base URL: `http://localhost:5001/v1`

### Text Generation WebUI (Gradio)
1. Load a vision model
2. Enable API mode
3. Base URL: `http://localhost:5000/v1`

## 📚 Resources

- **LM Studio**: https://lmstudio.ai/
- **Vision Models**: https://huggingface.co/models?pipeline_tag=image-text-to-text
- **LLaVA Models**: https://huggingface.co/liuhaotian
- **MiniCPM-V**: https://huggingface.co/openbmb/MiniCPM-V-2_6
- **Qwen2-VL**: https://huggingface.co/Qwen/Qwen2.5-VL-7B-Instruct

## ⚠️ Remember

- **Gemma 3, Llama 3.1, Mistral, Phi-3** = Text-only ❌
- **LLaVA, MiniCPM-V, Qwen-VL, InternVL** = Vision support ✅

For plant health analysis, you **must** use a vision model!
