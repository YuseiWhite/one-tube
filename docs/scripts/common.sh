#!/usr/bin/env bash
# すべてのスクリプト用の共通関数と変数

# リポジトリルートを取得
get_repo_root() {
    git rev-parse --show-toplevel
}

# 現在のブランチを取得
get_current_branch() {
    git rev-parse --abbrev-ref HEAD
}

# 現在のブランチが機能ブランチかチェック
# 有効な場合0、無効な場合1を返す
check_feature_branch() {
    local branch="$1"
    # 柔軟なブランチ命名: feature/* なら何でもOK
    if [[ ! "$branch" =~ ^feature/ ]]; then
        echo "ERROR: 機能ブランチにいません。現在のブランチ: $branch"
        echo "機能ブランチは 'feature/' で始まる必要があります"
        echo ""
        echo "有効な例:"
        echo "  - feature/yuseiwhite (ユーザー名ベース)"
        echo "  - feature/nft-purchase (機能名ベース)"
        echo "  - feature/001-smart-contract (Issue番号付き)"
        return 1
    fi
    return 0
}

# 機能ディレクトリパスを取得
# 複数のパスを試行し、最初に見つかったものを返す
# 見つからない場合は空文字列を返す（エラーにしない）
get_feature_dir() {
    local repo_root="$1"
    local branch="$2"
    # feature/ prefixを除去してディレクトリ名にする
    local dir_name="${branch#feature/}"

    # 複数のパスを試行
    local paths=(
        "$repo_root/docs/issues/$dir_name"
        "$repo_root/docs/specs/$dir_name"
        "$repo_root/docs/plans/$dir_name"
        "$repo_root/docs/$dir_name"
    )

    for path in "${paths[@]}"; do
        if [[ -d "$path" ]]; then
            echo "$path"
            return 0
        fi
    done

    # 見つからない場合はデフォルトパスを返す（作成はしない）
    echo "$repo_root/docs/issues/$dir_name"
    return 0
}

# 機能のすべての標準パスを取得
# 使用方法: eval $(get_feature_paths)
# 設定: REPO_ROOT, CURRENT_BRANCH, FEATURE_DIR, FEATURE_SPEC, IMPL_PLAN, TASKS
get_feature_paths() {
    local repo_root=$(get_repo_root)
    local current_branch=$(get_current_branch)
    local feature_dir=$(get_feature_dir "$repo_root" "$current_branch")

    echo "REPO_ROOT='$repo_root'"
    echo "CURRENT_BRANCH='$current_branch'"
    echo "FEATURE_DIR='$feature_dir'"
    echo "FEATURE_SPEC='$feature_dir/spec.md'"
    echo "IMPL_PLAN='$feature_dir/plan.md'"
    echo "TASKS='$feature_dir/tasks.md'"
    echo "RESEARCH='$feature_dir/research.md'"
    echo "DATA_MODEL='$feature_dir/data-model.md'"
    echo "QUICKSTART='$feature_dir/quickstart.md'"
    echo "CONTRACTS_DIR='$feature_dir/contracts'"
}

# ファイルが存在するかチェックして報告
check_file() {
    local file="$1"
    local description="$2"
    if [[ -f "$file" ]]; then
        echo "  ✓ $description"
        return 0
    else
        echo "  ✗ $description"
        return 1
    fi
}

# ディレクトリが存在し、ファイルがあるかチェック
check_dir() {
    local dir="$1"
    local description="$2"
    if [[ -d "$dir" ]] && [[ -n "$(ls -A "$dir" 2>/dev/null)" ]]; then
        echo "  ✓ $description"
        return 0
    else
        echo "  ✗ $description"
        return 1
    fi
}