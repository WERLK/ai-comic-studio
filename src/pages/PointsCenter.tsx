import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Coins, Gift, Trophy, ArrowLeft, CheckCircle, ArrowUpRight, ArrowDownRight, ShoppingBag } from 'lucide-react';
import { useAuthStore } from '@/stores';

export function PointsCenter() {
  const navigate = useNavigate();
  const { 
    user, 
    points, 
    transactions, 
    dailyRewards, 
    exchangeItems, 
    claimReward, 
    exchangeItem 
  } = useAuthStore();

  const [activeTab, setActiveTab] = useState<'rewards' | 'shop' | 'history'>('rewards');
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const handleClaimReward = (rewardId: string) => {
    const success = claimReward(rewardId);
    if (success) {
      setMessage({ text: '领取成功！', type: 'success' });
    } else {
      setMessage({ text: '领取失败', type: 'error' });
    }
    setTimeout(() => setMessage(null), 3000);
  };

  const handleExchangeItem = (itemId: string) => {
    const success = exchangeItem(itemId);
    if (success) {
      setMessage({ text: '兑换成功！', type: 'success' });
    } else {
      setMessage({ text: '积分不足或库存不足', type: 'error' });
    }
    setTimeout(() => setMessage(null), 3000);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-cyber-dark cyber-grid">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate('/')}
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-display text-2xl font-bold text-white">积分中心</h1>
        </div>

        <div className="bg-gradient-to-br from-cyber-purple/20 to-cyber-pink/20 border border-cyber-purple/30 rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyber-yellow to-cyber-pink flex items-center justify-center">
              <Coins className="w-8 h-8 text-cyber-dark" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">当前积分</p>
              <p className="font-display text-4xl font-bold neon-text-yellow">{points}</p>
            </div>
          </div>
        </div>

        {message && (
          <div className={`mb-6 rounded-xl p-4 ${
            message.type === 'success' 
              ? 'bg-green-500/20 border border-green-500/30' 
              : 'bg-red-500/20 border border-red-500/30'
          }`}>
            <p className={`text-sm ${
              message.type === 'success' ? 'text-green-400' : 'text-red-400'
            }`}>
              {message.text}
            </p>
          </div>
        )}

        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          <button
            onClick={() => setActiveTab('rewards')}
            className={`px-4 py-2 rounded-xl font-medium text-sm whitespace-nowrap transition-all ${
              activeTab === 'rewards'
                ? 'bg-cyber-pink text-white shadow-neon'
                : 'bg-cyber-dark2 text-gray-400 hover:text-white'
            }`}
          >
            <Trophy className="w-4 h-4 inline mr-2" />
            积分获取
          </button>
          <button
            onClick={() => setActiveTab('shop')}
            className={`px-4 py-2 rounded-xl font-medium text-sm whitespace-nowrap transition-all ${
              activeTab === 'shop'
                ? 'bg-cyber-pink text-white shadow-neon'
                : 'bg-cyber-dark2 text-gray-400 hover:text-white'
            }`}
          >
            <ShoppingBag className="w-4 h-4 inline mr-2" />
            积分商城
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-xl font-medium text-sm whitespace-nowrap transition-all ${
              activeTab === 'history'
                ? 'bg-cyber-pink text-white shadow-neon'
                : 'bg-cyber-dark2 text-gray-400 hover:text-white'
            }`}
          >
            <Gift className="w-4 h-4 inline mr-2" />
            积分记录
          </button>
        </div>

        {activeTab === 'rewards' && (
          <div className="space-y-4">
            {dailyRewards.map((reward) => (
              <div
                key={reward.id}
                className="bg-cyber-dark2/80 backdrop-blur-xl border border-cyber-purple/20 rounded-2xl p-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      reward.isCompleted 
                        ? 'bg-gray-700/50' 
                        : 'bg-gradient-to-br from-cyber-purple to-cyber-pink'
                    }`}>
                      {reward.isCompleted ? (
                        <CheckCircle className="w-6 h-6 text-gray-400" />
                      ) : (
                        <Trophy className="w-6 h-6 text-white" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-medium text-white">{reward.name}</h3>
                      <p className="text-sm text-gray-400">{reward.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-display text-lg font-bold text-cyber-yellow">+{reward.points}</span>
                    <button
                      onClick={() => handleClaimReward(reward.id)}
                      disabled={reward.isCompleted}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                        reward.isCompleted
                          ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                          : 'bg-gradient-to-r from-cyber-pink to-cyber-purple text-white shadow-neon hover:shadow-lg'
                      }`}
                    >
                      {reward.isCompleted ? '已完成' : '领取'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'shop' && (
          <div className="grid md:grid-cols-2 gap-4">
            {exchangeItems.map((item) => (
              <div
                key={item.id}
                className="bg-cyber-dark2/80 backdrop-blur-xl border border-cyber-purple/20 rounded-2xl p-4"
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-cyber-blue to-cyber-purple flex items-center justify-center flex-shrink-0">
                    <Gift className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-white">{item.name}</h3>
                    <p className="text-sm text-gray-400 line-clamp-2">{item.description}</p>
                    <p className="text-xs text-gray-500 mt-1">库存: {item.stock}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-display text-xl font-bold text-cyber-yellow">{item.price}</span>
                  <button
                    onClick={() => handleExchangeItem(item.id)}
                    disabled={points < item.price || item.stock <= 0}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                      points < item.price || item.stock <= 0
                        ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                        : 'bg-gradient-to-r from-cyber-pink to-cyber-purple text-white shadow-neon hover:shadow-lg'
                    }`}
                  >
                    兑换
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-3">
            {transactions.length === 0 ? (
              <div className="text-center py-12">
                <Gift className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500">暂无积分记录</p>
              </div>
            ) : (
              transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="bg-cyber-dark2/80 backdrop-blur-xl border border-cyber-purple/20 rounded-xl p-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        transaction.type === 'earn'
                          ? 'bg-green-500/20'
                          : 'bg-red-500/20'
                      }`}>
                        {transaction.type === 'earn' ? (
                          <ArrowUpRight className="w-5 h-5 text-green-400" />
                        ) : (
                          <ArrowDownRight className="w-5 h-5 text-red-400" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-white">{transaction.description}</p>
                        <p className="text-xs text-gray-500">{formatDate(transaction.createdAt)}</p>
                      </div>
                    </div>
                    <span className={`font-display text-lg font-bold ${
                      transaction.type === 'earn' ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {transaction.type === 'earn' ? '+' : '-'}{transaction.amount}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
