console.log(
    '%cbuild from PakePlus： https://github.com/Sjj1024/PakePlus',
    'color:orangered;font-weight:bolder'
)

// 文件上传和下载增强脚本
// Enhanced script for file upload and download functionality

// 检测是否为文件下载链接
const isDownloadLink = (url, element) => {
    if (!url) return false;
    
    // 检查下载属性
    if (element && element.hasAttribute('download')) {
        return true;
    }
    
    // 检查文件扩展名
    const downloadExtensions = [
        '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
        '.zip', '.rar', '.7z', '.tar', '.gz',
        '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg',
        '.mp3', '.mp4', '.avi', '.mov', '.wmv', '.flv',
        '.txt', '.rtf', '.csv', '.json', '.xml',
        '.apk', '.exe', '.dmg', '.deb', '.rpm'
    ];
    
    const urlLower = url.toLowerCase();
    const hasDownloadExtension = downloadExtensions.some(ext => 
        urlLower.includes(ext)
    );
    
    // 检查URL中是否包含download参数或download关键词
    const hasDownloadParam = urlLower.includes('download') || 
                             urlLower.includes('attachment') ||
                             urlLower.includes('export');
    
    // 检查Content-Disposition或其他下载相关的URL模式
    const hasDownloadPattern = /\/download\/|\/export\/|\/attachment\/|\/file\//i.test(url);
    
    return hasDownloadExtension || hasDownloadParam || hasDownloadPattern;
}

// 处理文件下载
const handleDownload = async (url, filename) => {
    try {
        console.log('开始处理文件下载:', url);
        
        // 方法1: 尝试创建隐藏的iframe来处理下载
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        iframe.src = url;
        document.body.appendChild(iframe);
        
        // 清理iframe
        setTimeout(() => {
            if (iframe.parentNode) {
                iframe.parentNode.removeChild(iframe);
            }
        }, 5000);
        
        // 方法2: 如果支持，尝试使用fetch + blob下载
        if (window.fetch) {
            try {
                const response = await fetch(url);
                if (response.ok) {
                    const blob = await response.blob();
                    const downloadUrl = window.URL.createObjectURL(blob);
                    
                    const a = document.createElement('a');
                    a.href = downloadUrl;
                    a.download = filename || 'download';
                    a.style.display = 'none';
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    
                    // 清理blob URL
                    setTimeout(() => {
                        window.URL.revokeObjectURL(downloadUrl);
                    }, 1000);
                    
                    console.log('文件下载成功:', filename);
                    return true;
                }
            } catch (fetchError) {
                console.log('fetch下载失败，使用备用方法:', fetchError.message);
            }
        }
        
        // 方法3: 尝试直接跳转下载
        window.location.href = url;
        
    } catch (error) {
        console.error('下载处理失败:', error);
        // 最后的备用方案：直接跳转
        window.location.href = url;
    }
}

// 创建文件选择器
const createFileSelector = (accept, multiple = false) => {
    return new Promise((resolve, reject) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = accept || '*/*';
        input.multiple = multiple;
        input.style.display = 'none';
        
        input.onchange = (e) => {
            const files = Array.from(e.target.files);
            document.body.removeChild(input);
            resolve(files);
        };
        
        input.oncancel = () => {
            document.body.removeChild(input);
            resolve([]);
        };
        
        // 添加超时处理
        setTimeout(() => {
            if (input.parentNode) {
                document.body.removeChild(input);
                reject(new Error('文件选择超时'));
            }
        }, 60000); // 60秒超时
        
        document.body.appendChild(input);
        input.click();
    });
};

// 处理文件上传
const handleFileUpload = async (uploadUrl, files, additionalData = {}) => {
    if (!files || files.length === 0) {
        console.log('没有选择文件');
        return;
    }
    
    try {
        console.log('开始上传文件:', files.map(f => f.name));
        
        const formData = new FormData();
        
        // 添加文件
        if (files.length === 1) {
            formData.append('file', files[0]);
        } else {
            files.forEach((file, index) => {
                formData.append(`file${index}`, file);
            });
        }
        
        // 添加额外数据
        Object.keys(additionalData).forEach(key => {
            formData.append(key, additionalData[key]);
        });
        
        // 发送上传请求
        const response = await fetch(uploadUrl, {
            method: 'POST',
            body: formData
        });
        
        if (response.ok) {
            const result = await response.json();
            console.log('文件上传成功:', result);
            
            // 触发页面刷新或更新
            if (typeof window.location.reload === 'function') {
                window.location.reload();
            }
            
            return result;
        } else {
            throw new Error(`上传失败: ${response.status} ${response.statusText}`);
        }
        
    } catch (error) {
        console.error('文件上传失败:', error);
        alert(`文件上传失败: ${error.message}`);
        throw error;
    }
};

// 检测是否为文件上传相关元素
const isUploadElement = (element) => {
    if (!element) return false;
    
    // 检查input[type="file"]
    if (element.tagName === 'INPUT' && element.type === 'file') {
        return true;
    }
    
    // 检查是否为上传按钮
    const uploadKeywords = ['上传', 'upload', '选择文件', 'choose file', 'browse', '添加文件'];
    const text = (element.textContent || element.value || '').toLowerCase();
    const className = (element.className || '').toLowerCase();
    const id = (element.id || '').toLowerCase();
    
    return uploadKeywords.some(keyword => 
        text.includes(keyword.toLowerCase()) ||
        className.includes(keyword.toLowerCase()) ||
        id.includes(keyword.toLowerCase())
    );
};

// 查找上传URL
const findUploadUrl = (element) => {
    // 查找最近的form元素
    const form = element.closest('form');
    if (form && form.action) {
        return form.action;
    }
    
    // 查找data属性
    const uploadUrl = element.getAttribute('data-upload-url') ||
                     element.getAttribute('data-url') ||
                     element.getAttribute('data-action');
    
    if (uploadUrl) {
        return uploadUrl;
    }
    
    // 根据当前路径推测上传URL
    const currentPath = window.location.pathname;
    if (currentPath.includes('cloud')) {
        return '/api/cloud/upload';
    } else if (currentPath.includes('homework')) {
        return '/api/homework/upload';
    }
    
    return '/api/upload'; // 默认上传URL
};

// 主要的点击处理函数
const hookClick = async (e) => {
    const target = e.target;
    const origin = target.closest('a');
    const isBaseTargetBlank = document.querySelector('head base[target="_blank"]');
    
    console.log('点击检测:', target, origin, isBaseTargetBlank);
    
    // 处理文件上传相关点击
    if (isUploadElement(target)) {
        console.log('检测到上传元素点击:', target);
        
        // 如果是input[type="file"]，让其正常工作
        if (target.tagName === 'INPUT' && target.type === 'file') {
            console.log('文件输入框，正常处理');
            return;
        }
        
        // 如果是上传按钮，触发文件选择
        e.preventDefault();
        e.stopPropagation();
        
        try {
            const accept = target.getAttribute('accept') || 
                          target.getAttribute('data-accept') || '*/*';
            const multiple = target.hasAttribute('multiple') || 
                           target.hasAttribute('data-multiple');
            
            const files = await createFileSelector(accept, multiple);
            
            if (files.length > 0) {
                const uploadUrl = findUploadUrl(target);
                
                // 获取额外数据
                const additionalData = {};
                const path = target.getAttribute('data-path');
                if (path) additionalData.path = path;
                
                await handleFileUpload(uploadUrl, files, additionalData);
            }
        } catch (error) {
            console.error('处理文件上传失败:', error);
        }
        
        return;
    }
    
    // 处理下载链接
    if (origin && origin.href && isDownloadLink(origin.href, origin)) {
        console.log('检测到下载链接:', origin.href);
        e.preventDefault();
        e.stopPropagation();
        
        // 获取文件名
        let filename = origin.download || origin.getAttribute('data-filename');
        if (!filename) {
            const urlParts = origin.href.split('/');
            filename = urlParts[urlParts.length - 1] || 'download';
        }
        
        await handleDownload(origin.href, filename);
        return;
    }
    
    // 处理普通的_blank链接
    if (origin && origin.href && 
        ((origin.target === '_blank') || isBaseTargetBlank)) {
        e.preventDefault();
        console.log('处理_blank链接:', origin.href);
        location.href = origin.href;
    } else {
        console.log('普通点击，不处理');
    }
};

// 处理拖拽上传
const handleDragAndDrop = () => {
    let dragCounter = 0;
    
    const handleDragEnter = (e) => {
        e.preventDefault();
        dragCounter++;
        console.log('拖拽进入页面');
    };
    
    const handleDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
    };
    
    const handleDragLeave = (e) => {
        e.preventDefault();
        dragCounter--;
        if (dragCounter === 0) {
            console.log('拖拽离开页面');
        }
    };
    
    const handleDrop = async (e) => {
        e.preventDefault();
        dragCounter = 0;
        
        const files = Array.from(e.dataTransfer.files);
        if (files.length === 0) return;
        
        console.log('检测到拖拽文件:', files.map(f => f.name));
        
        // 确认是否上传
        const confirmUpload = confirm(`确定要上传 ${files.length} 个文件吗？`);
        if (!confirmUpload) return;
        
        try {
            // 根据当前页面确定上传URL
            let uploadUrl = '/api/upload';
            const currentPath = window.location.pathname;
            
            if (currentPath.includes('cloud')) {
                uploadUrl = '/api/cloud/upload';
            } else if (currentPath.includes('homework')) {
                uploadUrl = '/api/homework/upload';
            }
            
            await handleFileUpload(uploadUrl, files);
        } catch (error) {
            console.error('拖拽上传失败:', error);
        }
    };
    
    // 添加拖拽事件监听
    document.addEventListener('dragenter', handleDragEnter);
    document.addEventListener('dragover', handleDragOver);
    document.addEventListener('dragleave', handleDragLeave);
    document.addEventListener('drop', handleDrop);
    
    console.log('拖拽上传功能已启用');
};

// 增强文件输入框
const enhanceFileInputs = () => {
    const fileInputs = document.querySelectorAll('input[type="file"]');
    
    fileInputs.forEach(input => {
        // 移除已有的事件监听器（如果有的话）
        const newInput = input.cloneNode(true);
        input.parentNode.replaceChild(newInput, input);
        
        // 添加增强的change事件
        newInput.addEventListener('change', async (e) => {
            const files = Array.from(e.target.files);
            if (files.length === 0) return;
            
            console.log('文件输入框选择文件:', files.map(f => f.name));
            
            // 查找对应的上传URL
            const uploadUrl = findUploadUrl(newInput);
            
            // 获取额外数据
            const additionalData = {};
            const form = newInput.closest('form');
            if (form) {
                const formData = new FormData(form);
                for (let [key, value] of formData.entries()) {
                    if (key !== newInput.name) {
                        additionalData[key] = value;
                    }
                }
            }
            
            try {
                await handleFileUpload(uploadUrl, files, additionalData);
            } catch (error) {
                console.error('文件上传失败:', error);
            }
        });
    });
    
    console.log(`增强了 ${fileInputs.length} 个文件输入框`);
};

// 处理动态添加的元素
const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
                // 检查新添加的下载链接
                const links = node.querySelectorAll ? node.querySelectorAll('a[href]') : [];
                links.forEach(link => {
                    if (isDownloadLink(link.href, link)) {
                        console.log('发现新的下载链接:', link.href);
                    }
                });
                
                // 检查新添加的文件输入框
                const fileInputs = node.querySelectorAll ? node.querySelectorAll('input[type="file"]') : [];
                if (fileInputs.length > 0) {
                    console.log('发现新的文件输入框，进行增强');
                    enhanceFileInputs();
                }
            }
        });
    });
});

// 初始化函数
const initialize = () => {
    // 注册事件监听器
    document.addEventListener('click', hookClick, { capture: true });
    
    // 启用拖拽上传
    handleDragAndDrop();
    
    // 增强现有的文件输入框
    enhanceFileInputs();
    
    // 开始观察DOM变化
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
    
    console.log('PakePlus文件上传下载增强脚本已加载');
    
    // 添加全局函数供其他脚本调用
    window.pakeDownload = handleDownload;
    window.pakeUpload = handleFileUpload;
    window.pakeCreateFileSelector = createFileSelector;
};

// 确保DOM准备就绪后初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
} else {
    initialize();
}