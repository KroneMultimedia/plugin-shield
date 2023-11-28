<?php

namespace KMM\Shield;

class Core
{
    private $plugin_dir;

    public function __construct()
    {
        global $wpdb;
        $this->wpdb = $wpdb;
        $this->plugin_dir = plugin_dir_url(__FILE__) . '../';
        $this->add_filters();
    }

    private function add_filters()
    {
        add_action('admin_menu', [$this, 'enqueue_styles'], 20);
        add_action('admin_enqueue_scripts', [$this, 'enqueue_scripts'], 10, 1);
        add_action('rest_api_init', function () {
            register_rest_route('kmm/v2', '/alive', [
                'methods' => 'POST',
                'callback' => [$this, 'check_alive'],
                'permission_callback' => '__return_true', // This makes it publicly accessible without authentication
            ]);
        });
    }

    public function check_alive(\WP_REST_Request $request)
    {
        $data = [
                'logged_in' => is_user_logged_in(),
            ];

        $uid = $request->get_param('user');
        $post = $request->get_param('post');

        $msg = "User without active session hit save :panic:\n";

        $user_data = get_userdata($uid);
        if ($user_data) {
            $msg .= 'Username: ' . $user_data->user_login . "\n";
        }

        $msg .= 'PostID: ' . $post . "\n";

        if (! is_user_logged_in()) {
            do_action('krn_send_slack', ['channel' => '#debug-editor', 'text' => $msg], true);
        }

        return new \WP_REST_Response($data, 200);
    }

    public function enqueue_styles()
    {
        wp_enqueue_style('idb_style', $this->plugin_dir . '/assets/css/idb.css');
    }

    public function enqueue_scripts()
    {
        wp_enqueue_script('krn_idb', $this->plugin_dir . '/assets/js/idb.js', ['jquery']);
        wp_enqueue_script('idb', $this->plugin_dir . '/assets/js/krn_snapshot.js', ['krn_idb', 'jquery']);
    }
}
