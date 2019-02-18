<?php

namespace KMM\Shield;

class Core {
    private $plugin_dir;

    public function __construct() {
        global $wpdb;
        $this->wpdb = $wpdb;
        $this->plugin_dir = plugin_dir_url(__FILE__) . '../';
        $this->add_filters();
    }

    private function add_filters() {
        add_action('admin_menu', [$this, 'enqueue_styles'], 20);
        add_action('admin_enqueue_scripts', [$this, 'enqueue_scripts'], 10, 1);
    }

    public function enqueue_styles() {
        wp_enqueue_style('idb_style', $this->plugin_dir . '/assets/css/idb.css');
    }

    public function enqueue_scripts() {
        wp_enqueue_script('krn_idb', $this->plugin_dir . '/assets/js/idb.js', ['jquery']);
        wp_enqueue_script('idb', $this->plugin_dir . '/assets/js/krn_snapshot.js', ['krn_idb', 'jquery']);
    }
}
