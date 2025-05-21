<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Ticketschat;
use App\Models\Conversation;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class DashboardController extends Controller
{
    /**
     * Get dashboard statistics
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getStats(Request $request)
    {
        try {
            // Get date range from request
            $startDate = $request->input('start_date') ? Carbon::parse($request->input('start_date')) : Carbon::now()->subDays(7);
            $endDate = $request->input('end_date') ? Carbon::parse($request->input('end_date')) : Carbon::now();
            
            // Ensure end date is set to the end of the day
            $endDate = $endDate->copy()->endOfDay();
            
            // Log the date range for debugging
            Log::info('Dashboard stats date range', ['start' => $startDate->toDateTimeString(), 'end' => $endDate->toDateTimeString()]);
            
            // Get user statistics
            $totalUsers = User::count();
            $newUsers = User::whereBetween('created_at', [$startDate, $endDate])->count();
            
            // Get ticket statistics
            $totalTickets = Ticketschat::count();
            
            // Check the actual column name for admin responses
            $repliedTickets = Ticketschat::whereNotNull('commentaire_admin')->count();
            $unrepliedTickets = Ticketschat::whereNull('commentaire_admin')->count();
            
            // Get feedback statistics
            $totalFeedback = Ticketschat::whereNotNull('evaluation')->count();
            $positiveFeedback = Ticketschat::where('evaluation', 'jaime')->count();
            $negativeFeedback = Ticketschat::where('evaluation', 'jenaimepas')->count();
            
            // Get admin comments count
            $adminComments = Ticketschat::whereNotNull('commentaire_admin')->count();
            
            // Get conversation statistics
            $totalConversations = Conversation::count();
            $conversationsToday = Conversation::whereDate('created_at', Carbon::today())->count();
            
            // Compile statistics
            $stats = [
                'totalUsers' => $totalUsers,
                'newUsers' => $newUsers,
                'totalTickets' => $totalTickets,
                'repliedTickets' => $repliedTickets,
                'unrepliedTickets' => $unrepliedTickets,
                'totalFeedback' => $totalFeedback,
                'positiveFeedback' => $positiveFeedback,
                'negativeFeedback' => $negativeFeedback,
                'adminComments' => $adminComments,
                'totalConversations' => $totalConversations,
                'conversationsToday' => $conversationsToday,
            ];
            
            // Log the stats for debugging
            Log::info('Dashboard stats calculated', ['stats' => $stats]);
            
            // Get feedback chart data (daily counts)
            $feedbackChartData = $this->getFeedbackChartData($startDate, $endDate);
            
            // Get conversation chart data (daily counts)
            $conversationChartData = $this->getConversationChartData($startDate, $endDate);
            
            // Get ticket evaluation chart data (daily counts)
            $ticketEvaluationChartData = $this->getTicketEvaluationChartData($startDate, $endDate);
            
            // Get recent tickets
            $recentTickets = $this->getRecentTickets();
            
            return response()->json([
                'stats' => $stats,
                'feedbackChartData' => $feedbackChartData,
                'conversationChartData' => $conversationChartData,
                'ticketEvaluationChartData' => $ticketEvaluationChartData,
                'recentTickets' => $recentTickets
            ]);
        } catch (\Exception $e) {
            Log::error('Error in dashboard stats', ['error' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
            return response()->json(['error' => 'Failed to retrieve dashboard statistics: ' . $e->getMessage()], 500);
        }
    }
    
    /**
     * Get feedback chart data
     *
     * @param Carbon $startDate
     * @param Carbon $endDate
     * @return array
     */
    private function getFeedbackChartData(Carbon $startDate, Carbon $endDate)
    {
        $dates = [];
        $current = $startDate->copy();
        
        // Generate all dates in range
        while ($current <= $endDate) {
            $dates[] = $current->format('Y-m-d');
            $current = $current->addDay();
        }
        
        // Format dates for display
        $formattedDates = array_map(function($date) {
            return Carbon::parse($date)->format('M d');
        }, $dates);
        
        // Get positive feedback counts by day
        $positiveFeedback = Ticketschat::where('evaluation', 'jaime')
            ->whereBetween('created_at', [$startDate, $endDate])
            ->selectRaw('DATE(created_at) as date, COUNT(*) as count')
            ->groupBy('date')
            ->pluck('count', 'date')
            ->toArray();
            
        // Get negative feedback counts by day
        $negativeFeedback = Ticketschat::where('evaluation', 'jenaimepas')
            ->whereBetween('created_at', [$startDate, $endDate])
            ->selectRaw('DATE(created_at) as date, COUNT(*) as count')
            ->groupBy('date')
            ->pluck('count', 'date')
            ->toArray();
        
        // Fill in missing dates with zeros
        $positiveData = [];
        $negativeData = [];
        
        foreach ($dates as $date) {
            $positiveData[] = $positiveFeedback[$date] ?? 0;
            $negativeData[] = $negativeFeedback[$date] ?? 0;
        }
        
        return [
            'labels' => $formattedDates,
            'positive' => $positiveData,
            'negative' => $negativeData
        ];
    }
    
    /**
     * Get conversation chart data
     *
     * @param Carbon $startDate
     * @param Carbon $endDate
     * @return array
     */
    private function getConversationChartData(Carbon $startDate, Carbon $endDate)
    {
        $dates = [];
        $current = $startDate->copy();
        
        // Generate all dates in range
        while ($current <= $endDate) {
            $dates[] = $current->format('Y-m-d');
            $current = $current->addDay();
        }
        
        // Format dates for display
        $formattedDates = array_map(function($date) {
            return Carbon::parse($date)->format('M d');
        }, $dates);
        
        // Get conversation counts by day
        $conversations = Conversation::whereBetween('created_at', [$startDate, $endDate])
            ->selectRaw('DATE(created_at) as date, COUNT(*) as count')
            ->groupBy('date')
            ->pluck('count', 'date')
            ->toArray();
        
        // Fill in missing dates with zeros
        $conversationData = [];
        
        foreach ($dates as $date) {
            $conversationData[] = $conversations[$date] ?? 0;
        }
        
        return [
            'labels' => $formattedDates,
            'data' => $conversationData
        ];
    }
    
    /**
     * Get recent tickets
     *
     * @return \Illuminate\Database\Eloquent\Collection
     */
    /**
     * Get ticket evaluation chart data
     *
     * @param Carbon $startDate
     * @param Carbon $endDate
     * @return array
     */
    private function getTicketEvaluationChartData(Carbon $startDate, Carbon $endDate)
    {
        $dates = [];
        $current = $startDate->copy();
        
        // Generate all dates in range
        while ($current <= $endDate) {
            $dates[] = $current->format('Y-m-d');
            $current = $current->addDay();
        }
        
        // Format dates for display
        $formattedDates = array_map(function($date) {
            return Carbon::parse($date)->format('M d');
        }, $dates);
        
        // Get evaluation counts by day
        $evaluations = Ticketschat::whereBetween('created_at', [$startDate, $endDate])
            ->whereNotNull('evaluation')
            ->selectRaw('DATE(created_at) as date, evaluation, COUNT(*) as count')
            ->groupBy('date', 'evaluation')
            ->get()
            ->groupBy('date')
            ->map(function ($group) {
                return $group->pluck('count', 'evaluation')->toArray();
            })
            ->toArray();
        
        // Fill in missing dates with zeros
        $positiveData = [];
        $negativeData = [];
        
        foreach ($dates as $date) {
            $dayData = $evaluations[$date] ?? [];
            $positiveData[] = $dayData['jaime'] ?? 0;
            $negativeData[] = $dayData['jenaimepas'] ?? 0;
        }
        
        return [
            'labels' => $formattedDates,
            'positive' => $positiveData,
            'negative' => $negativeData
        ];
    }
    
    /**
     * Get recent tickets
     *
     * @return array
     */
    private function getRecentTickets()
    {
        return Ticketschat::with('user:id,name')
            ->select('id', 'user_id', 'question', 'status', 'evaluation', 'created_at', 'commentaire_admin')
            ->orderBy('created_at', 'desc')
            ->take(10)
            ->get()
            ->map(function ($ticket) {
                return [
                    'id' => $ticket->id,
                    'user_name' => $ticket->user->name,
                    'question' => $ticket->question,
                    'status' => $ticket->status ?? 'open',
                    'evaluation' => $ticket->evaluation,
                    'has_admin_comment' => !empty($ticket->commentaire_admin),
                    'created_at' => $ticket->created_at->format('Y-m-d H:i:s')
                ];
            });
    }
}
