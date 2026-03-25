const fs = require('fs');
let code = fs.readFileSync('frontend/app/(main)/settings.tsx', 'utf8');

const useEffectBlock = `  useEffect(() => {
    loadMemories();
  }, [loadMemories]);`;

const loadMemoriesBlock = `  const loadMemories = useCallback(async () => {
    setIsLoadingMemories(true);
    try {
      const data = await ApiService.getMemories();
      setMemories(data);
    } catch {
      /* Non-fatal */
    } finally {
      setIsLoadingMemories(false);
    }
  }, []);`;

code = code.replace(useEffectBlock, "");
code = code.replace(loadMemoriesBlock, loadMemoriesBlock + "\n\n" + useEffectBlock);

fs.writeFileSync('frontend/app/(main)/settings.tsx', code);
