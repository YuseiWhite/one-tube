# AI時代のソフトウェア開発を考える from Takuto WADAさん at Jul 4, 2025 at Findy 開発生産性カンファレンス 2025

ref  
<https://speakerdeck.com/twada/agentic-software-engineering-findy-2025-07-edition>

以下の文章はrefのpdfをテキスト化することで，テキストで読みやすくしたものです．

## The End of Programming as We Know It

Tim O'Reilly  
<https://www.oreilly.com/radar/the-end-of-programming-as-we-know-it/>

## 「Vibe Coding」の誕生

Andrej Karpathy (@karpathy)

> There's a new kind of coding I call "vibe coding", where you fully give in to the vibes, embrace exponentials, and forget that the code even exists. It's possible because the LLMs (e.g. Cursor Composer w Sonnet) are getting too good. Also I just talk to Composer with SuperWhisper so I barely even touch the keyboard. I ask for the dumbest things like "decrease the padding on the sidebar by half" because I'm too lazy to find it. I "Accept All" always, I don't read the diffs anymore. When I get error messages I just copy paste them in with no comment, usually that fixes it. The code grows beyond my usual comprehension, I'd have to really read through it for a while. Sometimes the LLMs can't fix a bug so I just work around it or ask for random changes until it goes away. It's not too bad for throwaway weekend projects, but still quite amusing. I'm building a project or webapp, but it's not really coding - I just see stuff, say stuff, run stuff, and copy paste stuff, and it mostly works.

翻訳:

> 私が「バイブ・コーディング（vibe coding）」と呼んでいる、新しい種類のコーディングがあります。そこでは、その場の雰囲気（vibe）に完全に身を任せ、指数関数的な進化を受け入れ、コードの存在すら忘れてしまうのです。
> これが可能になったのは、LLM（例えばCursor ComposerとSonnet）がすごすぎるからです。それに、私はSuperWhisperを使ってComposerに話しかけるだけなので、キーボードにはほとんど触れさえしません。面倒くさがって自分で探そうとせず、「サイドバーのパディングを半分にして」みたいな、どうでもいいようなことまで頼んでしまいます。
> 私は常に「すべて承認」し、差分（diff）はもう読みません。エラーメッセージが出たら、ただコメントも付けずにコピペするだけで、大抵はそれで直ってしまいます。コードは次第に自分の普段の理解を超えて成長していくので、ちゃんと理解するにはしばらく読み込まなければならないでしょう。時々LLMがバグを修正できないこともありますが、その時は自分で回避策をとるか、バグが消えるまで手当たり次第に変更を依頼します。
> 週末に作る使い捨てのプロジェクトなら、それほど悪くはありません。それにしても、かなり面白い体験です。私はプロジェクトやウェブアプリを構築していますが、それはもはやコーディングとは言えないでしょう。何かを見て、何かを言って、何かを実行して、何かをコピペするだけ。そして、だいたいそれで動いてしまうのです。

<https://x.com/karpathy/status/1886192184808149383>

## 2025年、世界は Vibe Coding の熱に包まれた

- 2025年、AI エージェントの進化、特に Vibe Coding の登場により、プログラミングの速度(物的生産性)は圧倒的に高速化した。
- 多くの人はその速度と可能性に魅了され、動作確認だけで開発するようになった。
- Vibe Coding をソフトウェアエンジニアリングの観点から表現するなら
  - 製品品質の中から機能適合性のみを実際の動作確認で検証することでコードレビューを省略し、開発のスループットを最大化している状態と表現できる。

## Claude Max の衝撃

- Claude Max プランで Claude Code が従量課金から定額制になったのが破壊的だった。
- 従量課金だと「なるべく効率的に、一発で良いものを」と考えていたものが、月額固定額になると「試行回数を増やして積極的に使い倒さないと損」になった。心理状態が大きく変わることが、無視できない効果を生んだ。
- コスト構造とインセンティブを変え、投機的プログラミング(ガチャともいう)の世界をひらいた。
- これまでのコーディングエージェントよりも自走力がかなり高い。
- エージェントを複数活用した並列開発も、あまりにも魅力的すぎた。
- コストと工数は下がり、コード出力量は増えた。
- みな Claude Code に夢中になり、より Output 指向になった。

## そして時が加速した

- Vibe Coding をはじめとした AI の開発生産性により、開発規模が大きくなると発生する諸問題が、ごく短期間で発生するようになった。
  - 技術的負債の高速な積み上げによる開発スループット低下
  - レビューできない分量のコード
  - Unknown-Unknown 領域の拡大
  - 増加するセキュリティリスク
- 内部品質への投資の損益分岐点はどう移動したか

## 時が加速し、損益分岐点が移動した

生成AIの登場により生産性が交差する点が前倒しになった。いまは数日から1週間くらいか。  
<https://scrapbox.io/files/68e244720010947575bc1a91.png>

## 適切に設計がされていれば･･････も復活

Takuto Wadaさんより  
ソフトウェアエンジニアリングの歴史はずっとこれ（ベテランはたくさんの実例を挙げられると思う）。  
引用元: Yuta SAWA @sawawww より  
この話、何十年か前に同じことを言ってたんですよ。「適切に設計がされていればプログラマは外注や下請けでもいい」とかそういうやつ。その結果どうなったかと言うと、という。  
<https://x.com/t_wada/status/1935866334832914861>

## 問題の構造は変わらず、圧倒的に顕在化が早まっただけ

- 技術的負債の高速な積み上げによる開発スループット低下は新たな課題か => 否。
- 「レビューが課題となる」は新たな課題か => 否。
- 「正しく適切なドキュメントを書けばコーディングは些細な問題」は新たな考えか。
  - 否: ソフトウェアエンジニアリングの歴史にはずっと存在する（何度も墓からよみがえるタフなゾンビ）。

落ち着いて見ると、問題の構造はあまり変わっていない。道具が変わり、顕在化するのがあまりにも早くなっただけ。  
プログラミングを越えてソフトウェアエンジニアリングが必要になるタイミングが大幅に早まった。

## ソフトウェアエンジニアリングは時間で積分したプログラミング

我々が提案するのは、「ソフトウェアエンジニアリング」とは単にコードを書く行為のみならず、組織が時間の経過に応じてコードを構築し保守するために用いるツールとプロセス全てをも包含するということである。  
長期間にわたりコードを価値ある状態に保守することを最もうまく行うためのプラクティスとしてソフトウェア組織が導入できるのは、どのようなものか。エンジニアたちはどのようにして、コードベース (codebase) †1 をさらに持続可能にしつつ、ソフトウェアエンジニアリングの規律自体を厳格化できるだろうか。我々はこれらの問いへの根本的な解を持ち合わせてはいないが、過去20年にわたるGoogleの集団的経験が、解の発見へ向かう道となりうるものを照らしてくれることを願っている。  
本書が共有する重要な見識に、「ソフトウェアエンジニアリングとは『時間で積分したプログラミング』」とみなせる、というものがある。自分たちのコードを、着想し、導入し、保守し、廃止するまでのライフサイクルを通じて持続可能 (sustainable) †2 なものとするためにコードに導入できるのは、どんなプラクティスだろうか。  
本書では、コードを設計し、コードのアーキテクチャーを定め、コードを書いていく際に、ソフトウェア組織が留意すべきと我々が感じる3つの根本的原則に重点が置かれている。

- 時間と変化: コードがその存続期間にわたりどのように適応していかなければならないか。
- スケールと発展: 進化するにつれて組織がどのように適応していかなければならないか。
- トレードオフとコスト: 「時間と変化」、「スケールと発展」から得られる教訓に基づき、組織がどのように決定を行うべきか。

「Googleだからそうなんでしょ」と思っていた規模の諸問題が自分たちのところにも短期間で降り注ぐようになった。

ソフトウェアエンジニアリングは時間で積分したプログラミング

- スタイルガイドとルール
- コードレビュー
- ドキュメンテーション
- テストサイズとテストダブル
- モノレポ
- 包括的構成管理
- 継続的テスティング
- 継続的インテグレーション
- 継続的デリバリー

ref  
Googleのソフトウェアエンジニアリング  
<https://amzn.asia/d/c1aitzT>

## TDD から何を学んだか

- ソフトウェア開発は未知と既知の陣取りゲーム。
- 設計に終わりはない。
- 終わらない設計を自動テストとリファクタリングで支える。
- 実装から設計へのフィードバックがある。

ref  
テスト駆動開発  
<https://amzn.asia/d/9Hb8sA9>

## DDD から何を学んだか

- ドメインエキスパートとの対話と共通の語彙が大事。
- 境界付けられたコンテクストの中で一貫した語彙を使う。
- コードとモデルは互いにフィードバックしあう。一方通行ではない。
- コードとドキュメントは互いにフィードバックしあう。一方通行ではない。

ref  
エリック・エヴァンスのドメイン駆動設計  
<https://amzn.asia/d/dQ3NCbn>  
ドメイン駆動設計をはじめよう ―ソフトウェアの実装と事業戦略を結びつける実践技法  
<https://amzn.asia/d/8TNgbFH>

## リソース効率よりフロー効率

- 制約理論で考える。ボトルネックを解消しないとスループットは上がらない。
- レビュー待ちのPRは「在庫」。コーディングがボトルネックではないならば、コーディング量を増やしてPRをどれだけ積み上げても「在庫のムダ」。
- AI エージェントによる並列開発も同じ構図。
- ペアプロやモブプロで、レビュー、教育、フロー効率向上を手がけた。

ref  
ザ・ゴール ― 企業の究極の目的とは何か  
<https://amzn.asia/d/cL14r1L>

## ビルドトラップを避ける

- ひたすら新機能追加に邁進してしまいがち。
- AIもこの傾向が強い。基本的に足し算指向。
- 大事なのは Output より Outcome (成果)や Impact。
- Outcome につながらないなら Output をどれだけ増やしても意味がない。

ref  
プロダクトマネジメント ―ビルドトラップを避け顧客に価値を届ける  
<https://amzn.asia/d/2TcbHsl>

## Vibe Coding から Agentic Coding

Vibe coding は直感的で人間中心の対話的なワークフローを重視するのに対し、Agentic coding は目標志向のエージェントによる自律的なソフトウェア開発を可能にする。  
<https://scrapbox.io/files/68e248438a619f78086a06ad.png>

ref  
Vibe Coding vs. Agentic Coding: Fundamentals and Practical Implications of Agentic AI  
Ranjan Sapkota, Konstantinos I. Roumeliotis, Manoj Karkee  
This review presents a comprehensive analysis of two emerging paradigms in AI-assisted software development: vibe coding and agentic coding. While both leverage large language models (LLMs), they differ fundamentally in autonomy, architectural design, and the role of the developer. Vibe coding emphasizes intuitive, human-in-the-loop interaction through prompt-based, conversational workflows that support ideation, experimentation, and creative exploration. In contrast, agentic coding enables autonomous software development through goal-driven agents capable of planning, executing, testing, and iterating tasks with minimal human intervention. We propose a detailed taxonomy spanning conceptual foundations, execution models, feedback loops, safety mechanisms, debugging strategies, and real-world tool ecosystems. Through comparative workflow analysis and 20 detailed use cases, we illustrate how vibe systems thrive in early-stage prototyping and education, while agentic systems excel in enterprise-grade automation, codebase refactoring, and CI/CD integration. We further examine emerging trends in hybrid architectures, where natural language interfaces are coupled with autonomous execution pipelines. Finally, we articulate a future roadmap for agentic AI, outlining the infrastructure needed for trustworthy, explainable, and collaborative systems. Our findings suggest that successful AI software engineering will rely not on choosing one paradigm, but on harmonizing their strengths within a unified, human-centered development lifecycle.  
<https://arxiv.org/abs/2505.19443>

## AIとの協業の2つのモード

AIと伴走

- AIと対話しながら直列開発
- コードを書くスピードは（「AIに委託」に比べて）遅い
- コントロールや状況把握の度合いが高い
- traditional: "決定的ではあるものの、人力であるためスケールしない"

AIに委託

- 自走するAIたちに任せて並列開発
- コードが生成されるスピードは圧倒的に速い
- コントロールや状況把握の度合いが低く、レビューが課題となる
- emerging: "非決定的で結果が確率的ではあるものの、非常によくスケールする"

<https://buildersbox.corp-sansan.com/entry/2025/07/03/142500>

## どの領域にどう AI を使うか

<https://scrapbox.io/files/68e248ac577d6195d79ed24f.png>

業務ロジックの複雑さと競合他社との差別化の度合いによって、AIの活用法は異なる。

- 複雑で差別化が必要な領域（中核）: AIと伴走。
- 単純で差別化が不要な領域（補完）: AIに委託。

ref  
ドメイン駆動設計をはじめよう ―ソフトウェアの実装と事業戦略を結びつける実践技法  
<https://amzn.asia/d/8TNgbFH>

## 伴走のパターンと委託のパターン

「AIと伴走」のパターン: 教習車、助手席、根負けしない議論相手、リサーチアシスタント、批判的レビュアー、運転席（オーガニック・コーディング）。  
「AIに委託」のパターン: 0-1, 1-100、小人さん、ファンネル、コンペ。

## 典型的な「AIと伴走」のパターン（2025初夏時点）

- 対話: LLMとの議論、LLMからの質問から設計を生む
  - 生まれた設計をプレーンテキストのドキュメント（Design Doc, ADR）に保存
  - 設計書のレビューを行い、必要であれば議論に戻る
- 設計書からタスクリスト（markdown）を生成し保存
  - タスクのレビューを行い、必要であれば議論に戻る
- タスクリストからタスクを1つ選び、サブタスクに分割
  - サブタスクの順番をTDDのワークフローにあわせて調整
- タスク毎にコーディングエージェントのセッションを立ち上げて（あるいは /compact して）実装
  - タスク毎にGitのブランチを作成（ダメだった-らブランチを廃棄する）
  - TDDのワークフローを指定し、レビュー不能な量のコードが一度に生成されることを防ぐ
  - TDDのステップ毎にConventional Commitsのルールでコミットさせる
- マージ前に全体レビュー。必要であれば人間が手直しし、ブランチをマージ
- 学びを反映させるために再びLLMと議論する

## 自動化（automation）から自働化（autonomation）へ

- Agentic Coding は望ましい状態を宣言的に定義し、評価関数（適応度関数）を与えると、エージェントがその状態に自律的に収束するように働く。
- AI は自走するが暴走・迷走もするため、ガードレール設計としてのソフトウェアエンジニアリングや技術の3本柱（バージョン管理，テスティング，自動化）の重要性さらにが増している。

ref  
進化的アーキテクチャ ―絶え間ない変化を支える  
<https://amzn.asia/d/dXvX4d5>  
ソフトウェアアーキテクチャメトリクス ―アーキテクチャ品質を改善する10のアドバイス  
<https://amzn.asia/d/epobYUv>

## 求める品質特性を定量的表現でAIに伝える

ソフトウェアの品質を6つの特性に分け、それぞれを定性的・定量的にどう評価するかを定義したもの  
AIに開発を依頼する際の明確な評価基準（合格ライン）を具体的に示さなければならない  
例えば、「保守性の高いコードを書いて」という曖昧な指示ではなく、「認知複雑性を低く、コアモジュールの変更率を安定させて」といった定量的な指標（Indicative quantitative measures）で指示することで、AIが目標を理解し、自律的にその基準を満たすコードを生成することを目指せるようになります。

table:

| Characteristic | Description | Indicative qualitative measures | Indicative quantitative measures |
| --- | --- | --- | --- |
| Correct | "It behaves as intended, with key workflows verified preferably through fast-running automated tests." | "Edge cases are handled; no regressions during basic use." | "Test pass rate near 100%; mutation score > 80%." |
| Testable | "Its design supports meaningful unit, integration and end-to-end testing." | "Tests are fast, focused and isolated; naming is consistent and purposeful." | "Unit test coverage > 90%; no test flakiness." |
| Maintainable | "The code is readable, modular and consistent enough for others to safely understand and change." | "Idiomatic structure; easy onboarding for new contributors." | "Low cognitive complexity; stable change rate in core modules." |
| Scalable | "It's designed with non-functional concerns like performance, security and operational robustness in mind." | "Design anticipates growth; avoids excessive coupling." | "Baseline performance benchmarks; graceful degradation patterns." |
| Diagnosable | "It provides enough instrumentation and structural clarity to support effective troubleshooting." | "Logs are meaningful and context-rich; failures are traceable." | "Presence of structured logs; alert coverage for key failure paths." |
| Disciplined | "It follows sound engineering practices - version control, CI, static analysis, etc." | "Frequent commits with clear messages; workflow is CI-compliant." | "Commits gated by CI; clean lint runs; no critical SAST issues." |

table:

| 品質特性 | 説明 | 定性的な指標 | 定量的な指標 |
| --- | --- | --- | --- |
| 正確性 (Correct) | 意図通りに動作し、主要なワークフローは高速な自動テストによって検証されていることが望ましい。 | エッジケースが処理されている。基本的な使用時にリグレッション（機能低下）が発生しない。 | テスト成功率が100%に近い。ミューテーションスコアが80%を超える。 |
| テスト可能性 (Testable) | その設計が、意味のある単体・統合・E2Eテストをサポートしている。 | テストは高速で、焦点が絞られ、分離されている。命名は一貫しており目的が明確である。 | 単体テストカバレッジが90%を超える。テストの不安定さ（flakiness）がない。 |
| 保守性 (Maintainable) | コードは可読性があり、モジュール化され、一貫性があるため、他者が安全に理解し変更できる。 | 慣用的な構造である。新規貢献者が容易に参加できる（オンボーディングが容易）。 | 認知的複雑性が低い。コアモジュールの変更率が安定している。 |
| 拡張性 (Scalable) | パフォーマンス、セキュリティ、運用の堅牢性といった非機能要件を念頭に置いて設計されている。 | 設計が将来の成長を予測している。過度な結合を避けている。 | パフォーマンスのベースラインとなるベンチマークがある。グレースフル・デグラデーション（正常な機能低下）のパターンが実装されている。 |
| 診断可能性 (Diagnosable) | 効果的なトラブルシューティングをサポートするのに十分な計装（instrumentation）と構造的な明確さを提供している。 | ログは有益で文脈情報が豊富である。障害は追跡可能である。 | 構造化ログが存在する。主要な障害パスに対するアラートカバレッジがある。 |
| 規律 (Disciplined) | バージョン管理、CI、静的解析など、健全なエンジニアリングプラクティスに従っている。 | 明確なメッセージを持つ頻繁なコミットがある。ワークフローはCIに準拠している。 | コミットはCIによってゲートされている。Lintがクリーンに実行される。重大なSAST（静的アプリケーションセキュリティテスト）の問題がない。 |

ref  
<https://www.thoughtworks.com/insights/blog/generative-ai/can-vibe-coding-produce-production-grade-software>

## ツール/ライブラリ作者はLLM親和性を考える時代

人間とAIに対しての書き方の違い

code:.bash

```bash
AssertionError [ERR_ASSERTION]:

# Human-readable format:
assert(scoreOf(rollsOf(frames)) === 132)
       |       |       |        |   |
       |       |       |        |   132
       |       |       |        false
       |       |       [[1,4],[4,5],[6,4],[5,5],[10],[0,1],[7,3],[6,4],[10],[2,8,6]]
       |       [1,4,4,5,6,4,5,5,10,0,1,7,3,6,4,10,2,8,6]
       133

# AI-readable format:
Assertion failed: assert(scoreOf(rollsOf(frames)) === 132)
=== arg:0 ===
Step 1: `frames` => [[1,4],[4,5],[6,4],[5,5],[10],[0,1],[7,3],[6,4],[10],[2,8,6]]
Step 2: `rollsOf(frames)` => [1,4,4,5,6,4,5,5,10,0,1,7,3,6,4,10,2,8,6]
Step 3: `scoreOf(rollsOf(frames))` => 133
Step 4: `132` => 132
Step 5: `scoreOf(rollsOf(frames)) === 132` => false

133 === 132
```

ref  
<https://github.com/twada/power-assert-monorepo/pull/23>

## 自動テストの重要性はより高まる

適応度関数、ガードレール技術の筆頭  
自動テストの目的（2024版）  
信頼性の高い実行結果に短い時間で到達する状態を保つことで、開発者に根拠ある自信を与え、ソフトウェアの成長を持続可能にすること  
自動テストの目的（2025版）  
信頼性の高い実行結果に短い時間で到達する状態を保つことで、AIに根拠ある判断基準を与え、ソフトウェアの成長を持続可能にすること

## 包括的な構成管理

- モノレポが有利か
- 開発に関わる全てをリポジトリに入れる
- ドキュメントはプレーンテキストで、コードの近くに置かないと腐る
- 「AIへ委託」はAIの速さを殺さない非同期並列開発
  - マイクロマネジメントできないので、後からの監査が大事になる
- gitによる変更トレーサビリティ確保
  - Conventional Commits
  - Keep a changelog

ref  
<https://www.conventionalcommits.org/ja/v1.0.0/>

## MTBF から MTTR へ

- バグゼロのゼロリスク信仰から離れる
- 確信、把握の度合いを落として開発スループットをあげる
- ソフトウェア開発はふたたび Unknown-Unknown 領域に戻ろうとしている
- Known-Unknown や Unknown-Unknown と戦う武器を増やす。Property-based Testingや、オブザーバビリティの向上で戦う

ref  
実践プロパティベーステスト ― PropErとErlang/Elixirではじめよう  
<https://amzn.asia/d/1ZaWdjb>  
オブザーバビリティ・エンジニアリング   
<https://amzn.asia/d/46IpHXL>

## レビュー負荷軽減の工夫

- diff最小化バイアスがジワジワとシステムのエントロピーを上げる
- 『Tidy First?』の知見を活用する
  - Behavior Change と Structure Change を分ける
  - Behavior Change のレビューコストと Structure Change のレビューコストは異なる
  - Behavior Change は不可逆変更。きちんとレビューする
  - Structure Change は可逆変更。ソフトウェアエンジニアリングの観点で仕組み化してレビューコストを０に近づけたい

ref  
Tidy First? ―個人で実践する経験主義的ソフトウェア設計  
エクストリームプログラミングによりシステク全体構造を念頭においてコードを改善する  
<https://amzn.asia/d/2iMvR7T>

## 現実を見つめよう

- 我々は最初から正しい設計をすることはできない。
  - コードを書き始め，その時に初めて問題を理解することばかり
  - 実装から設計へのフィードバックが必ずある。
- わからないものはレビューもできない。
- あるとき正しい設計だったものも、時間が経つと正しくなくなる。
- システム設計とは、ある時点の合目的的な設計から、次の時点の合目的的な設計までの状態遷移、その意思決定の連続である。

## 個人と組織が能力を上げなければならない

「AIは知識の代替ではなく増幅器」 by Tomohisa Takaokaさん  
「高度なAIは自分の鏡みたいなもので、AIから引き出せる性能は、自分の能力にそのまま比例する」 by mizchiさん  
高度なAIは組織の鏡みたいなもので、AIから引き出せる性能は、組織の能力にそのまま比例する  
労力は外注できるが、能力は外注できない  
個人と組織が共に能力を上げなければならない

## 能力向上のためにも AI を使う

- Output を出すためだけでなく、自分たちの能力を上げるためにも AI を使う。
  - 設計のバディとして使う。
  - 批判的レビュアーとして使う。
  - 根負けしない議論相手として使う。
  - 新しい言語を学ぶためにも使う。
- あえてのオーガニック・コーディングもいい
  - アウトプット最小，フィードバック最大

## 学びにも追い風が吹いている

1. 何回同じことを聞いても怒られず即時フィードバックを得られる
2. フワッとした曖昧な質問から専門用語（≒検索キーワード）に辿り着ける

この2点は（特に初心者の）ソフトウェアエンジニアの教育あるいは独学においてChatGPT等の対話型生成AIが果たした画期的な進化だと考えています。  
[yusei.icon]全く同じことを言ってた

ref  
<https://x.com/t_wada/status/1880037737392402496>

## 「賭ける」べきか否か

結局のところ「`code = ai(docs)`」はほとんどの場合成り立つだろうか？  
既存コードを直すより、ドキュメントから生成し直す方がはやくかつ良くなるのだろうか？  
結局のところ抽象度が一段上がるのだろうか？コードはアセンブラ相当になり、自然言語がコード相当になるのだろうか？  
アセンブラは確かに一方通行だ  
ともすると「問題は将来のAIが解決してくれるはず」と考えがち  
コーディングは競争力を失うのだろうか？  
我々はコーディングをやめるべきなのだろうか？

「賭ける」べきか否かの答え  
「〜べきか否か」という問いの立て方は誤っている  
我々はいま生成AIの光に目を焼かれて視野狭窄を起こし、バイアスの下にいる  
『決定力！：正解を導く4つのプロセス』を読むとバイアスとの戦い方がわかる  
「〜べきか否か」という問いの立て方は失敗に導かれやすい  
"whether or not" ではなく "compare and contrast"  
XOR ではなく AND  
決定を遅延すれば良い。選択肢を広げれば良い。  
賭けるのではなく「両にらみ」で行けば良い  
不確実な状況下において選択肢を狭めるのは危険でしかない

ref  
決定力！　正解を導く４つのプロセス  
<https://amzn.asia/d/89dAgiH>

## アマラの法則

We tend to overestimate the effect of a technology in the short run and underestimate the effect in the long run.  
私たちは技術の短期的な効果を過大評価し、長期的な効果を過小評価する傾向がある  
<https://en.wikipedia.org/wiki/Roy_Amara>

## 「変化を抱擁せよ」

私たちは技術の短期的な効果を過大評価し、長期的な効果を過小評価する傾向がある  
世界は思ったよりはゆっくりと、だが確実に大きく変わる。  
賭けなくていい。可能性を並べ、手を動かして評価し、変化を楽しもう。

## ご清聴ありがとうございました

- AIで時が加速したが、問題の構造、根本的原因は同じ。歴史から学んだ知見が今こそ重要。
- プログラミングからソフトウェアエンジニアリングへ。Vibe Coding から Agentic Coding。
- リソース効率重視の「委託」と、フロー効率重視の「伴走」。状況に応じて適切なモードを選択。
- 望ましい状態を宣言的に定義し、評価関数を与え、AIが自律的に収束する仕組みが自働化には重要。
- AIから引き出せる性能は、個人と組織の能力に比例する。能力向上への投資が不可欠。
- 現実を直視する。最初から正しい設計はできない。わからないものはレビューもできない。この前提で設計プロセスを組み立てる。
- 「賭ける」のではなく「両にらみ」。XORではなくAND。決定を遅延し、選択肢を広げ、可能性を並べて手を動かして評価する。
- 我々は短期的効果を過大評価し、長期的効果を過小評価しがち。世界は思ったよりはゆっくり、だが確実に変わる。


