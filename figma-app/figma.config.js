/** @type {import('@figma/code-connect').Config} */
module.exports = {
  // FigmaファイルのURLまたはファイルキー
  // 実際のFigmaファイルのURLに置き換えてください
  figmaFile: process.env.FIGMA_FILE_URL || '',
  
  // コンポーネントのマッピング設定
  components: {
    // Buttonコンポーネントのマッピング
    './src/components/ui/button.tsx': {
      Button: {
        figmaNodeName: 'Button', // Figma内のコンポーネント名
        props: {
          variant: {
            type: 'enum',
            figmaPropName: 'Variant',
            values: ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'],
          },
          size: {
            type: 'enum',
            figmaPropName: 'Size',
            values: ['default', 'sm', 'lg', 'icon'],
          },
          disabled: {
            type: 'boolean',
            figmaPropName: 'Disabled',
          },
        },
      },
    },
    
    // Headerコンポーネントのマッピング
    './src/components/Header.tsx': {
      Header: {
        figmaNodeName: 'Header',
        props: {
          isWalletConnected: {
            type: 'boolean',
            figmaPropName: 'Wallet Connected',
          },
          walletAddress: {
            type: 'string',
            figmaPropName: 'Wallet Address',
          },
        },
      },
    },
    
    // TicketCardコンポーネントのマッピング
    './src/components/TicketCard.tsx': {
      TicketCard: {
        figmaNodeName: 'Ticket Card',
        props: {
          isOwned: {
            type: 'boolean',
            figmaPropName: 'Owned',
          },
          ticket: {
            type: 'object',
            figmaPropName: 'Ticket Data',
          },
        },
      },
    },
    
    // VideoCardコンポーネントのマッピング
    './src/components/VideoCard.tsx': {
      VideoCard: {
        figmaNodeName: 'Video Card',
        props: {
          isOwned: {
            type: 'boolean',
            figmaPropName: 'Owned',
          },
          isSelected: {
            type: 'boolean',
            figmaPropName: 'Selected',
          },
          video: {
            type: 'object',
            figmaPropName: 'Video Data',
          },
        },
      },
    },
  },
  
  // 出力設定
  output: {
    // Code Connectファイルの出力先
    outputDir: './figma-code-connect',
  },
};

